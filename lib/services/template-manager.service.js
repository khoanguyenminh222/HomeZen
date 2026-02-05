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
                if (!placeholders.find(p => p.columnName === varName)) {
                    placeholders.push({
                        sheetName: 'HTML',
                        cellAddress: 'N/A',
                        pattern: match[0],
                        columnName: varName,
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
                ReportErrorCode.TEMPLATE_INVALID_FORMAT,
                ReportErrorCategory.TEMPLATE
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
    async createTemplate(metadata, createdBy) {
        try {
            const { name, description, procedureId, category, designerState, css, js, orientation, html } = metadata;

            // Kiểm tra tên trùng lặp (Task 3.8)
            const isNameExists = await prisma.reportTemplate.findFirst({
                where: { name, isActive: true }
            });

            if (isNameExists) {
                throw new ReportError(
                    `Tên mẫu báo cáo "${name}" đã tồn tại trong hệ thống.`,
                    ReportErrorCode.TEMPLATE_SAVE_FAILED,
                    ReportErrorCategory.TEMPLATE
                );
            }

            // Parse để lấy placeholders
            const parsed = html ? await this.parseTemplate(Buffer.from(html, 'utf8')) : { placeholders: [] };

            const template = await prisma.reportTemplate.create({
                data: {
                    name,
                    description,
                    procedureId,
                    placeholders: parsed.placeholders,
                    designerState: designerState || null,
                    content: html || null,
                    css: css || null,
                    js: js || null,
                    orientation: orientation || 'portrait',
                    category,
                    createdBy,
                    isActive: true,
                },
            });

            reportLogger.info(`Template "${name}" created successfully (DB only)`);
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
        const { page = 1, limit = 10, search = '' } = params;
        const skip = (page - 1) * limit;

        const where = {
            isActive: true,
            OR: search ? [
                { name: { contains: search } },
                { category: { contains: search } },
                { description: { contains: search } }
            ] : undefined
        };

        const [templates, total] = await Promise.all([
            prisma.reportTemplate.findMany({
                where,
                include: {
                    procedure: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.reportTemplate.count({ where })
        ]);

        return {
            templates,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Lấy chi tiết template bao gồm nội dung file
     */
    async getTemplate(id) {
        const template = await prisma.reportTemplate.findUnique({
            where: { id },
            include: {
                procedure: true,
            },
        });

        if (!template) {
            throw new ReportError('Template not found', ReportErrorCode.TEMPLATE_NOT_FOUND, ReportErrorCategory.TEMPLATE);
        }

        return template;
    }

    /**
     * Cập nhật template
     */
    async updateTemplate(id, metadata) {
        try {
            const existing = await prisma.reportTemplate.findUnique({ where: { id } });
            if (!existing) {
                throw new ReportError('Template not found', ReportErrorCode.TEMPLATE_NOT_FOUND, ReportErrorCategory.TEMPLATE);
            }

            const { name, description, procedureId, category, designerState, css, js, orientation, html } = metadata;

            if (name && name !== existing.name) {
                const isNameExists = await prisma.reportTemplate.findFirst({
                    where: { name, isActive: true, id: { not: id } }
                });

                if (isNameExists) {
                    throw new ReportError(
                        `Tên mẫu báo cáo "${name}" đã tồn tại. Vui lòng chọn tên khác.`,
                        ReportErrorCode.TEMPLATE_SAVE_FAILED,
                        ReportErrorCategory.TEMPLATE
                    );
                }
            }

            let updateData = { name, description, procedureId, category, designerState, css, js, orientation };
            if (html !== undefined) {
                updateData.content = html;
                const parsed = await this.parseTemplate(Buffer.from(html, 'utf8'));
                updateData.placeholders = parsed.placeholders;
            }

            const template = await prisma.reportTemplate.update({
                where: { id },
                data: updateData,
            });

            reportLogger.info(`Template "${template.name}" updated successfully (DB only)`);
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
            const template = await prisma.reportTemplate.findUnique({ where: { id } });
            if (!template) {
                throw new ReportError('Template not found', ReportErrorCode.TEMPLATE_NOT_FOUND, ReportErrorCategory.TEMPLATE);
            }

            await prisma.reportTemplate.update({
                where: { id },
                data: { isActive: false },
            });
            reportLogger.info(`Template "${template.name}" deleted (soft)`);
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
            const original = await prisma.reportTemplate.findUnique({
                where: { id },
            });

            if (!original) {
                throw new ReportError('Template not found', ReportErrorCode.TEMPLATE_NOT_FOUND, ReportErrorCategory.TEMPLATE);
            }

            // 1. Tạo tên mới cho bản sao (Đảm bảo duy nhất)
            let newName = `${original.name} (Bản sao)`;
            let counter = 1;
            while (await prisma.reportTemplate.findFirst({ where: { name: newName, isActive: true } })) {
                counter++;
                newName = `${original.name} (Bản sao ${counter})`;
            }

            const copy = await prisma.reportTemplate.create({
                data: {
                    name: newName,
                    description: original.description,
                    procedureId: original.procedureId,
                    placeholders: original.placeholders || [],
                    designerState: original.designerState,
                    content: original.content,
                    css: original.css,
                    js: original.js,
                    orientation: original.orientation,
                    category: original.category,
                    createdBy: userId,
                    isActive: true,
                },
            });

            reportLogger.info(`Template "${original.name}" copied to "${newName}"`);
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
