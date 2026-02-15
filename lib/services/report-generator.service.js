import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';
import { ReportError, ReportErrorCode, ReportErrorCategory } from '@/lib/utils/report-errors';
import { reportLogger } from '@/lib/utils/report-logger';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { getDataConnectorService } from './data-connector.service';
import { getVariableManagerService } from './variable-manager.service';

/**
 * Report Generator Service
 * Điều phối quy trình sinh báo cáo PDF từ HTML templates
 * Requirements: 2.1, 3.2, 5.1, 12.2
 */
export class ReportGeneratorService {
    constructor() {
        this.dataConnector = getDataConnectorService();
        this.variableManager = getVariableManagerService();
        this.registerHelpers();
    }

    /**
     * Đăng ký các Helpers cho Handlebars
     */
    registerHelpers() {
        const vm = getVariableManagerService();

        // Tránh đăng ký nhiều lần
        if (Handlebars.helpers.vnCurrency) return;

        Handlebars.registerHelper('vnCurrency', (amount) => vm.formatValue(amount, 'currency'));
        Handlebars.registerHelper('vnDate', (date) => vm.formatValue(date, 'date'));
        Handlebars.registerHelper('vnNumber', (num) => vm.formatValue(num, 'number'));
        Handlebars.registerHelper('eq', (a, b) => a === b);
        Handlebars.registerHelper('gt', (a, b) => a > b);
        Handlebars.registerHelper('lt', (a, b) => a < b);
        Handlebars.registerHelper('add', (a, b) => a + b);
        Handlebars.registerHelper('json', (context) => JSON.stringify(context, null, 2));
    }

    /**
     * Sinh báo cáo từ templateId và các tham số
     */
    async generateReport({ templateId, parameters, userId }) {
        const startTime = Date.now();
        try {
            // 1. Lấy thông tin template và procedure
            const template = await prisma.rPT_MAU_BAO_CAO.findUnique({
                where: { id: templateId },
                include: { thu_tuc: true },
            });

            if (!template) {
                throw new ReportError('Template not found', ReportErrorCode.MAU_BAO_CAO_KHONG_TON_TAI, ReportErrorCategory.MAU_BAO_CAO);
            }

            // 1.1 Kiểm tra quyền truy cập (nếu có userId)
            if (userId) {
                const user = await prisma.uSR_NGUOI_DUNG.findUnique({
                    where: { id: userId },
                    select: { vai_tro: true }
                });

                const isSuperAdmin = user?.vai_tro === 'SIEU_QUAN_TRI';
                const permissions = template.phan_quyen;
                const allowedUsers = permissions?.users || [];

                if (!isSuperAdmin && !allowedUsers.includes(userId)) {
                    throw new ReportError(
                        'You do not have permission to generate this report',
                        ReportErrorCode.KHONG_CO_QUYEN_TRUY_CAP,
                        ReportErrorCategory.XUAT_BAO_CAO
                    );
                }
            }

            if (!template.thu_tuc) {
                throw new ReportError(
                    'No procedure linked to this template',
                    ReportErrorCode.DINH_DANG_MAU_KHONG_HOP_LE,
                    ReportErrorCategory.MAU_BAO_CAO
                );
            }

            // 2. Làm giàu tham số: Tự động tiêm p_uid nếu procedure yêu cầu
            const enrichedParameters = { ...parameters };
            if (userId && template.thu_tuc.tham_so?.some(p => p.name === 'p_uid')) {
                enrichedParameters.p_uid = userId;
            }

            // 3. Thực thi Stored Procedure qua Data Connector
            let resultData = await this.dataConnector.executeProcedure(
                template.thu_tuc.ten,
                enrichedParameters,
                template.thu_tuc.tham_so
            );

            // 2.1 Xử lý biến điều kiện (Task 3.4)
            if (template.placeholder && Array.isArray(template.placeholder)) {
                resultData = this.variableManager.processConditionalVariables(resultData, template.placeholder);
            }

            // 3. Xử lý tên file báo cáo
            const sanitizedTemplateName = template.ten
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "D")
                .replace(/[^a-zA-Z0-9]/g, "_");

            const fileName = `Report_${sanitizedTemplateName}_${Date.now()}.pdf`;

            // 4. Sinh buffer PDF
            const buffer = await this.generatePDFFromHtml(template, resultData, userId);

            // 5. Lưu file báo cáo
            const outputPath = path.join(process.cwd(), 'public', 'reports', 'generated');
            try {
                await fs.mkdir(outputPath, { recursive: true });
                await fs.writeFile(path.join(outputPath, fileName), buffer);
            } catch (fsError) {
                throw new ReportError(
                    `Failed to save generated report: ${fsError.message}`,
                    ReportErrorCode.LOI_HE_THONG_TAP_TIN,
                    ReportErrorCategory.XUAT_BAO_CAO
                );
            }

            const generationTime = Date.now() - startTime;
            reportLogger.info(`Report (PDF) generated successfully: ${fileName} in ${generationTime}ms`);

            return {
                fileName,
                fileUrl: `/reports/generated/${fileName}`,
                generationTime,
            };
        } catch (error) {
            if (!(error instanceof ReportError)) {
                await reportLogger.error('Unexpected error in generateReport', error);
            }
            throw error;
        }
    }

    /**
     * Sinh HTML preview cho báo cáo
     */
    async generatePreview({ templateId, parameters, userId }) {
        try {
            const template = await prisma.rPT_MAU_BAO_CAO.findUnique({
                where: { id: templateId },
                include: { thu_tuc: true },
            });

            if (!template) throw new Error('Template not found');

            let resultData = await this.dataConnector.executeProcedure(
                template.thu_tuc.ten,
                parameters,
                template.thu_tuc.tham_so
            );

            // Xử lý biến điều kiện (Task 3.4)
            if (template.placeholder && Array.isArray(template.placeholder)) {
                resultData = this.variableManager.processConditionalVariables(resultData, template.placeholder);
            }

            const templateSource = template.noi_dung || '';
            if (!templateSource) throw new Error('Template content is empty');

            let userDisplayName = 'Xem trước';
            if (userId) {
                const user = await prisma.uSR_NGUOI_DUNG.findUnique({
                    where: { id: userId },
                    select: {
                        tai_khoan: true,
                        thong_tin_nha_tro: {
                            select: { ten_chu_nha: true }
                        }
                    }
                });
                if (user) userDisplayName = user.thong_tin_nha_tro?.ten_chu_nha || user.tai_khoan;
            }

            const compiledTemplate = Handlebars.compile(templateSource);
            const context = {
                ...(Array.isArray(resultData) && resultData.length > 0 ? resultData[0] : (!Array.isArray(resultData) ? resultData : {})),
                data: Array.isArray(resultData) ? resultData : [resultData],
                thong_tin_chinh: {
                    ten_mau: template.ten,
                    thoi_gian_tao: new Date().toLocaleString('vi-VN'),
                    tong_so_dong: Array.isArray(resultData) ? resultData.length : 1,
                    nguoi_lap: userDisplayName,
                    is_preview: true
                }
            };

            const htmlContent = compiledTemplate(context);
            return this._injectAssets(htmlContent, template.css, template.js);
        } catch (error) {
            reportLogger.error('Preview generation error', error);
            throw error;
        }
    }

    /**
     * Chuyển đổi dữ liệu sang PDF sử dụng Handlebars và Puppeteer
     */
    async generatePDFFromHtml(template, data, userId) {
        let browser = null;
        try {
            const templateSource = template.noi_dung || '';
            if (!templateSource) throw new Error('Template content is empty');

            // Lấy thông tin người lập biểu
            let userDisplayName = 'Hệ thống';
            if (userId) {
                const user = await prisma.uSR_NGUOI_DUNG.findUnique({
                    where: { id: userId },
                    select: {
                        tai_khoan: true,
                        thong_tin_nha_tro: {
                            select: { ten_chu_nha: true }
                        }
                    }
                });
                if (user) userDisplayName = user.thong_tin_nha_tro?.ten_chu_nha || user.tai_khoan;
            }

            const compiledTemplate = Handlebars.compile(templateSource);

            const context = {
                ...(Array.isArray(data) && data.length > 0 ? data[0] : (!Array.isArray(data) ? data : {})),
                data: Array.isArray(data) ? data : [data],
                thong_tin_chinh: {
                    ten_mau: template.ten,
                    thoi_gian_tao: new Date().toLocaleString('vi-VN'),
                    tong_so_dong: Array.isArray(data) ? data.length : 1,
                    nguoi_lap: userDisplayName
                }
            };

            const htmlContent = compiledTemplate(context);
            const finalHtml = this._injectAssets(htmlContent, template.css, template.js);

            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            const page = await browser.newPage();

            await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: template.huong_giay === 'landscape',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });

            return pdfBuffer;
        } catch (error) {
            reportLogger.error('HTML to PDF Generation error', error);
            throw new ReportError(
                `Failed to generate PDF from HTML: ${error.message}`,
                ReportErrorCode.LOI_HE_THONG_TAP_TIN,
                ReportErrorCategory.XUAT_BAO_CAO
            );
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Inject CSS and JS into HTML content
     */
    _injectAssets(html, css, js) {
        let result = html;
        if (css) {
            if (result.includes('</head>')) {
                result = result.replace('</head>', `<style>${css}</style></head>`);
            } else {
                result = `<style>${css}</style>${result}`;
            }
        }
        if (js) {
            if (result.includes('</body>')) {
                result = result.replace('</body>', `<script>${js}</script></body>`);
            } else {
                result = `${result}<script>${js}</script>`;
            }
        }
        return result;
    }
}

// Singleton instances
let reportGeneratorInstance = null;

export function getReportGeneratorService() {
    if (!reportGeneratorInstance) {
        reportGeneratorInstance = new ReportGeneratorService();
    }
    return reportGeneratorInstance;
}
