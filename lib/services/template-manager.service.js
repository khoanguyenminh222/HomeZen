import prisma from '@/lib/prisma';
import { ReportError, ReportErrorCode, ReportErrorCategory } from '@/lib/utils/report-errors';
import { reportLogger } from '@/lib/utils/report-logger';

/**
 * Template Manager Service
 * Quản lý HTML templates và placeholder mapping cho hệ thống báo cáo (Handlebars)
 * Requirements: 2.1, 2.2, 2.3, 5.2
 */
export class TemplateManagerService {
    /**
     * Parse template file để tìm các placeholders theo định dạng {{variable}}
     * Chỉ hỗ trợ file HTML (.html)
     */
    async parseTemplate(buffer) {
        try {
            const content = buffer.toString('utf8');

            // 1. Validation cú pháp cơ bản
            this.validateTemplate(content);

            const placeholders = [];
            const placeholderRegex = /\{\{([^}]+)\}\}/g;

            // 2. Xử lý HTML template
            let match;
            while ((match = placeholderRegex.exec(content)) !== null) {
                const varName = match[1].trim();

                // Bỏ qua các helpers hoặc cú pháp logic nâng cao (có khoảng trắng hoặc ký tự đặc biệt như #, /, else)
                if (varName.includes(' ') || varName.startsWith('#') || varName.startsWith('/') || varName.startsWith('else')) {
                    continue;
                }

                // Chỉ thêm nếu chưa có để tránh trùng lặp
                if (!placeholders.find(p => p.ten_cot === varName)) {
                    placeholders.push({
                        sheetName: 'HTML',
                        cellAddress: 'N/A',
                        pattern: match[0],
                        ten_cot: varName,
                    });
                }
            }

            return {
                placeholders,
                sheetCount: 1,
                type: 'html'
            };
        } catch (error) {
            throw new ReportError(
                error.message.includes('Cú pháp template') ? error.message : `Failed to parse HTML template: ${error.message}`,
                ReportErrorCode.DINH_DANG_MAU_KHONG_HOP_LE,
                ReportErrorCategory.MAU_BAO_CAO
            );
        }
    }

    /**
     * Kiểm tra tính hợp lệ của template (Task 2.4)
     */
    validateTemplate(content) {
        // Kiểm tra cặp ngoặc lồng nhau hoặc không khớp
        const opens = (content.match(/\{\{/g) || []).length;
        const closes = (content.match(/\}\}/g) || []).length;

        if (opens !== closes) {
            throw new Error(`Cú pháp template không hợp lệ: Số lượng thẻ mở '{{' (${opens}) không khớp với thẻ đóng '}}' (${closes}).`);
        }

        // Kiểm tra thẻ lồng nhau lỗi (VD: {{ {{var}} }})
        if (/\{\{[^}]*\{\{[^}]*\}\}/.test(content)) {
            throw new Error(`Cú pháp template không hợp lệ: Phát hiện thẻ lồng nhau không đúng cách.`);
        }

        return true;
    }

    /**
     * Lưu template mới
     */
    async createTemplate(thong_tin_mau, nguoi_tao) {
        try {
            const { ten, mo_ta, thu_tuc_id, danh_muc, css, js, huong_giay, noi_dung, anh_xa_tham_so } = thong_tin_mau;

            // Kiểm tra tên trùng lặp (Task 3.8)
            const isNameExists = await prisma.rPT_MAU_BAO_CAO.findFirst({
                where: { ten: ten, trang_thai: true }
            });

            if (isNameExists) {
                throw new ReportError(
                    `Tên mẫu báo cáo "${ten}" đã tồn tại trong hệ thống.`,
                    ReportErrorCode.LUU_MAU_BAO_CAO_THAT_BAI,
                    ReportErrorCategory.MAU_BAO_CAO
                );
            }

            // Parse để lấy placeholders
            const parsed = noi_dung ? await this.parseTemplate(Buffer.from(noi_dung, 'utf8')) : { placeholders: [] };

            const template = await prisma.rPT_MAU_BAO_CAO.create({
                data: {
                    ten: ten,
                    mo_ta: mo_ta,
                    thu_tuc_id: thu_tuc_id,
                    placeholder: parsed.placeholders,
                    noi_dung: noi_dung || null,
                    css: css || null,
                    js: js || null,
                    huong_giay: huong_giay || 'portrait',
                    anh_xa_tham_so: anh_xa_tham_so || [],
                    danh_muc: danh_muc,
                    nguoi_tao: nguoi_tao,
                    trang_thai: true,
                },
            });

            reportLogger.info(`Template "${ten}" created successfully (DB only)`);
            return template;
        } catch (error) {
            if (!(error instanceof ReportError)) {
                await reportLogger.error('Unexpected error in createTemplate', error);
            }
            throw error;
        }
    }

    /**
     * Liệt kê danh sách templates với phân trang và tìm kiếm (Task 13)
     */
    async listTemplates(params = {}) {
        const { page = 1, limit = 10, search = '', userRole, userId } = params;
        const skip = (page - 1) * limit;

        // Permission filter - Super Admin sees all, others only see templates they're assigned to
        let where = {
            trang_thai: true
        };

        // Add search filter if provided
        if (search) {
            where.OR = [
                { ten: { contains: search } },
                { danh_muc: { contains: search } },
                { mo_ta: { contains: search } }
            ];
        }

        // Fetch all templates first, then filter by permission in memory
        // This is because Prisma's JSON querying has limitations with array_contains
        const shouldFilterByPermission = userRole && userRole !== 'SIEU_QUAN_TRI' && userId;


        const [allTemplates, total] = await Promise.all([
            prisma.rPT_MAU_BAO_CAO.findMany({
                where,
                include: {
                    thu_tuc: {
                        select: {
                            ten: true,
                        },
                    },
                },
                orderBy: { ngay_tao: 'desc' },
            }),
            prisma.rPT_MAU_BAO_CAO.count({ where })
        ]);

        // Filter by permission if not Super Admin
        let templates = allTemplates;
        if (shouldFilterByPermission) {
            templates = allTemplates.filter(template => {
                const permissions = template.phan_quyen;
                if (!permissions || typeof permissions !== 'object') return false;
                const users = permissions.users || [];
                return Array.isArray(users) && users.includes(userId);
            });
        }

        // Apply pagination after filtering
        const filteredTotal = templates.length;
        const paginatedTemplates = templates.slice(skip, skip + limit);

        return {
            templates: paginatedTemplates,
            pagination: {
                total: filteredTotal,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(filteredTotal / limit)
            }
        };
    }

    /**
     * Lấy chi tiết template bao gồm nội dung file
     */
    async getTemplate(id) {
        const template = await prisma.rPT_MAU_BAO_CAO.findUnique({
            where: { id },
            include: {
                thu_tuc: true,
            },
        });

        if (!template) {
            throw new ReportError('Template not found', ReportErrorCode.MAU_BAO_CAO_KHONG_TON_TAI, ReportErrorCategory.MAU_BAO_CAO);
        }

        return template;
    }

    /**
     * Cập nhật template
     */
    async updateTemplate(id, thong_tin_mau) {
        try {
            const existing = await prisma.rPT_MAU_BAO_CAO.findUnique({ where: { id } });
            if (!existing) {
                throw new ReportError('Template not found', ReportErrorCode.MAU_BAO_CAO_KHONG_TON_TAI, ReportErrorCategory.MAU_BAO_CAO);
            }

            const { ten, mo_ta, thu_tuc_id, danh_muc, css, js, huong_giay, noi_dung, anh_xa_tham_so } = thong_tin_mau;

            if (ten && ten !== existing.ten) {
                const isNameExists = await prisma.rPT_MAU_BAO_CAO.findFirst({
                    where: { ten: ten, trang_thai: true, id: { not: id } }
                });

                if (isNameExists) {
                    throw new ReportError(
                        `Tên mẫu báo cáo "${ten}" đã tồn tại. Vui lòng chọn tên khác.`,
                        ReportErrorCode.LUU_MAU_BAO_CAO_THAT_BAI,
                        ReportErrorCategory.MAU_BAO_CAO
                    );
                }
            }

            let updateData = {
                ten: ten,
                mo_ta: mo_ta,
                thu_tuc_id: thu_tuc_id,
                danh_muc: danh_muc,
                css,
                js,
                huong_giay: huong_giay,
                anh_xa_tham_so: anh_xa_tham_so !== undefined ? anh_xa_tham_so : existing.anh_xa_tham_so
            };
            if (noi_dung !== undefined) {
                updateData.noi_dung = noi_dung;
                const parsed = await this.parseTemplate(Buffer.from(noi_dung, 'utf8'));
                updateData.placeholder = parsed.placeholders;
            }

            const template = await prisma.rPT_MAU_BAO_CAO.update({
                where: { id },
                data: updateData,
            });

            reportLogger.info(`Template "${template.ten}" updated successfully (DB only)`);
            return template;
        } catch (error) {
            if (!(error instanceof ReportError)) {
                await reportLogger.error('Unexpected error in updateTemplate', error);
            }
            throw error;
        }
    }

    /**
     * Xóa template (Soft delete)
     */
    async deleteTemplate(id) {
        try {
            const template = await prisma.rPT_MAU_BAO_CAO.findUnique({ where: { id } });
            if (!template) {
                throw new ReportError('Template not found', ReportErrorCode.MAU_BAO_CAO_KHONG_TON_TAI, ReportErrorCategory.MAU_BAO_CAO);
            }

            await prisma.rPT_MAU_BAO_CAO.update({
                where: { id },
                data: { trang_thai: false },
            });
            reportLogger.info(`Template "${template.ten}" deleted (soft)`);
        } catch (error) {
            if (!(error instanceof ReportError)) {
                await reportLogger.error('Unexpected error in deleteTemplate', error);
            }
            throw error;
        }
    }

    /**
     * Tạo bản sao của template (Task 3.5)
     */
    async copyTemplate(id, userId) {
        try {
            const original = await prisma.rPT_MAU_BAO_CAO.findUnique({
                where: { id },
            });

            if (!original) {
                throw new ReportError('Template not found', ReportErrorCode.MAU_BAO_CAO_KHONG_TON_TAI, ReportErrorCategory.MAU_BAO_CAO);
            }

            // 1. Tạo tên mới cho bản sao (Đảm bảo duy nhất)
            let newName = `${original.ten} (Bản sao)`;
            let counter = 1;
            while (await prisma.rPT_MAU_BAO_CAO.findFirst({ where: { ten: newName, trang_thai: true } })) {
                counter++;
                newName = `${original.ten} (Bản sao ${counter})`;
            }

            const copy = await prisma.rPT_MAU_BAO_CAO.create({
                data: {
                    ten: newName,
                    mo_ta: original.mo_ta,
                    thu_tuc_id: original.thu_tuc_id,
                    placeholder: original.placeholder || [],
                    noi_dung: original.noi_dung,
                    css: original.css,
                    js: original.js,
                    huong_giay: original.huong_giay,
                    danh_muc: original.danh_muc,
                    nguoi_tao: userId,
                    trang_thai: true,
                },
            });

            reportLogger.info(`Template "${original.ten}" copied to "${newName}"`);
            return copy;
        } catch (error) {
            if (!(error instanceof ReportError)) {
                await reportLogger.error('Unexpected error in copyTemplate', error);
            }
            throw error;
        }
    }

    /**
     * Sanitize filename for cross-platform compatibility
     */
    sanitizeFilename(name) {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(/[^a-zA-Z0-9]/g, "_");
    }
}

// Singleton instances
let templateManagerInstance = null;

export function getTemplateManagerService() {
    if (!templateManagerInstance) {
        templateManagerInstance = new TemplateManagerService();
    }
    return templateManagerInstance;
}
