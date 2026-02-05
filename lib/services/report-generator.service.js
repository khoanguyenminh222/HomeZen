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
            const template = await prisma.reportTemplate.findUnique({
                where: { id: templateId },
                include: { procedure: true },
            });

            if (!template) {
                throw new ReportError('Template not found', ReportErrorCode.TEMPLATE_NOT_FOUND, ReportErrorCategory.TEMPLATE);
            }
            if (!template.procedure) {
                throw new ReportError(
                    'No procedure linked to this template',
                    ReportErrorCode.TEMPLATE_INVALID_FORMAT,
                    ReportErrorCategory.TEMPLATE
                );
            }

            // 2. Thực thi Stored Procedure qua Data Connector
            let resultData = await this.dataConnector.executeProcedure(
                template.procedure.name,
                parameters,
                template.procedure.parameters
            );

            // 2.1 Xử lý biến điều kiện (Task 3.4)
            if (template.placeholders && Array.isArray(template.placeholders)) {
                resultData = this.variableManager.processConditionalVariables(resultData, template.placeholders);
            }

            // 3. Xử lý tên file báo cáo
            const sanitizedTemplateName = template.name
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
                    ReportErrorCode.GENERATION_FILE_SYSTEM_ERROR,
                    ReportErrorCategory.GENERATION
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
            const template = await prisma.reportTemplate.findUnique({
                where: { id: templateId },
                include: { procedure: true },
            });

            if (!template) throw new Error('Template not found');

            let resultData = await this.dataConnector.executeProcedure(
                template.procedure.name,
                parameters,
                template.procedure.parameters
            );

            // Xử lý biến điều kiện (Task 3.4)
            if (template.placeholders && Array.isArray(template.placeholders)) {
                resultData = this.variableManager.processConditionalVariables(resultData, template.placeholders);
            }

            const templateSource = template.content || '';
            if (!templateSource) throw new Error('Template content is empty');

            let userDisplayName = 'Xem trước';
            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        username: true,
                        propertyInfo: {
                            select: { ownerName: true }
                        }
                    }
                });
                if (user) userDisplayName = user.propertyInfo?.ownerName || user.username;
            }

            const compiledTemplate = Handlebars.compile(templateSource);
            const context = {
                ...(Array.isArray(resultData) && resultData.length > 0 ? resultData[0] : (!Array.isArray(resultData) ? resultData : {})),
                data: Array.isArray(resultData) ? resultData : [resultData],
                metadata: {
                    templateName: template.name,
                    generatedAt: new Date().toLocaleString('vi-VN'),
                    totalCount: Array.isArray(resultData) ? resultData.length : 1,
                    userName: userDisplayName,
                    isPreview: true
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
            const templateSource = template.content || '';
            if (!templateSource) throw new Error('Template content is empty');

            // Lấy thông tin người lập biểu
            let userDisplayName = 'Hệ thống';
            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        username: true,
                        propertyInfo: {
                            select: { ownerName: true }
                        }
                    }
                });
                if (user) userDisplayName = user.propertyInfo?.ownerName || user.username;
            }

            const compiledTemplate = Handlebars.compile(templateSource);

            const context = {
                ...(Array.isArray(data) && data.length > 0 ? data[0] : (!Array.isArray(data) ? data : {})),
                data: Array.isArray(data) ? data : [data],
                metadata: {
                    templateName: template.name,
                    generatedAt: new Date().toLocaleString('vi-VN'),
                    totalCount: Array.isArray(data) ? data.length : 1,
                    userName: userDisplayName
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
                landscape: template.orientation === 'landscape',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' }
            });

            return pdfBuffer;
        } catch (error) {
            reportLogger.error('HTML to PDF Generation error', error);
            throw new ReportError(
                `Failed to generate PDF from HTML: ${error.message}`,
                ReportErrorCode.GENERATION_FILE_SYSTEM_ERROR,
                ReportErrorCategory.GENERATION
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
