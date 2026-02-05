import prisma from '@/lib/prisma';
import { reportLogger } from '@/lib/utils/report-logger';

/**
 * Variable Manager Service
 * Quản lý định nghĩa biến, kiểu dữ liệu và định dạng cho hệ thống báo cáo
 * Requirements: 3.1, 3.2, 3.4, 9.1
 */
export class VariableManagerService {
    constructor() {
        this.variableTypes = {
            STRING: 'string',
            NUMBER: 'number',
            CURRENCY: 'currency',
            DATE: 'date',
            BOOLEAN: 'boolean',
            ARRAY: 'array',
            OBJECT: 'object'
        };

        // Các định dạng mặc định cho từng kiểu
        this.formats = {
            currency: {
                locale: 'vi-VN',
                style: 'currency',
                currency: 'VND'
            },
            date: {
                locale: 'vi-VN',
                options: { day: '2-digit', month: '2-digit', year: 'numeric' }
            },
            number: {
                locale: 'vi-VN',
                options: { minimumFractionDigits: 0, maximumFractionDigits: 2 }
            }
        };
    }

    /**
     * Định dạng giá trị dựa trên kiểu dữ liệu
     */
    formatValue(value, type, options = {}) {
        if (value === null || value === undefined) return '';

        try {
            switch (type) {
                case this.variableTypes.CURRENCY:
                    return new Intl.NumberFormat(options.locale || this.formats.currency.locale, {
                        ...this.formats.currency,
                        ...options
                    }).format(value);

                case this.variableTypes.DATE:
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return value;
                    return date.toLocaleDateString(options.locale || this.formats.date.locale, {
                        ...this.formats.date.options,
                        ...options
                    });

                case this.variableTypes.NUMBER:
                    return new Intl.NumberFormat(options.locale || this.formats.number.locale, {
                        ...this.formats.number.options,
                        ...options
                    }).format(value);

                case this.variableTypes.BOOLEAN:
                    return value ? (options.trueText || 'Có') : (options.falseText || 'Không');

                default:
                    return value.toString();
            }
        } catch (error) {
            reportLogger.warn(`Formatting error for value ${value} as ${type}`, error);
            return value.toString();
        }
    }

    /**
     * Khám phá các biến khả dụng từ kết quả của Stored Procedure
     */
    async discoverVariablesFromData(sampleData) {
        if (!sampleData || (Array.isArray(sampleData) && sampleData.length === 0)) return [];

        const item = Array.isArray(sampleData) ? sampleData[0] : sampleData;
        return Object.entries(item).map(([key, value]) => {
            let type = this.variableTypes.STRING;

            if (typeof value === 'number') {
                // Heuristic: nếu key chứa 'price', 'amount', 'revenue' thì là currency
                const currencyKeywords = ['price', 'amount', 'revenue', 'fee', 'charge', 'total', 'money'];
                if (currencyKeywords.some(kw => key.toLowerCase().includes(kw))) {
                    type = this.variableTypes.CURRENCY;
                } else {
                    type = this.variableTypes.NUMBER;
                }
            } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.length > 8)) {
                type = this.variableTypes.DATE;
            } else if (typeof value === 'boolean') {
                type = this.variableTypes.BOOLEAN;
            }

            return {
                name: key,
                type: type,
                description: `Tự động nhận diện từ dữ liệu (${key})`
            };
        });
    }

    /**
     * Kiểm tra tính hợp lệ của biến so với schema
     */
    validateVariables(data, schema) {
        const errors = [];
        schema.forEach(field => {
            const value = data[field.name];
            if (field.required && (value === undefined || value === null)) {
                errors.push(`Thiếu trường bắt buộc: ${field.name}`);
            }
            // Có thể thêm validation nâng cao về kiểu dữ liệu ở đây
        });
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Xử lý các biến điều kiện dựa trên dữ liệu (Task 3.4)
     * Cho phép tạo thêm các cờ (flags) logic từ dữ liệu thô
     */
    processConditionalVariables(data, rules = []) {
        if (!data || !rules.length) return data;

        const results = Array.isArray(data) ? data : [data];

        const processedData = results.map(item => {
            const newItem = { ...item };

            rules.forEach(rule => {
                if (!rule.name || !rule.condition) return;

                try {
                    // Hỗ trợ biểu thức đơn giản: field > value, field === value
                    const { name, condition } = rule;
                    const parts = condition.split(' ');
                    if (parts.length === 3) {
                        const [field, operator, value] = parts;
                        const itemVal = item[field];
                        const targetVal = isNaN(value) ? value.replace(/['"]/g, '') : Number(value);

                        let result = false;
                        switch (operator) {
                            case '>': result = itemVal > targetVal; break;
                            case '<': result = itemVal < targetVal; break;
                            case '>=': result = itemVal >= targetVal; break;
                            case '<=': result = itemVal <= targetVal; break;
                            case '===':
                            case '==': result = itemVal == targetVal; break;
                            case '!==':
                            case '!=': result = itemVal != targetVal; break;
                        }
                        newItem[name] = result;
                    }
                } catch (e) {
                    reportLogger.warn(`Failed to process conditional variable ${rule.name}`, e);
                }
            });

            return newItem;
        });

        return Array.isArray(data) ? processedData : processedData[0];
    }

    /**
     * Trả về hướng dẫn sử dụng các helpers và biến hệ thống (Task 3.4)
     */
    getHelpDocumentation() {
        return {
            helpers: [
                {
                    name: 'vnCurrency',
                    usage: '{{vnCurrency value}}',
                    description: 'Định dạng số thành tiền tệ VND (VD: 1.000.000 ₫)',
                    example: '{{vnCurrency price}}'
                },
                {
                    name: 'vnDate',
                    usage: '{{vnDate value}}',
                    description: 'Định dạng ngày tháng chuẩn Việt Nam (VD: 29/01/2026)',
                    example: '{{vnDate createdAt}}'
                },
                {
                    name: 'vnNumber',
                    usage: '{{vnNumber value}}',
                    description: 'Số có dấu phân cách hàng nghìn (VD: 1.234,56)',
                    example: '{{vnNumber quantity}}'
                },
                {
                    name: 'eq / gt / lt',
                    usage: '{{#if (eq status "PAID")}}...{{/if}}',
                    description: 'Các toán tử so sánh bằng (eq), lớn hơn (gt), nhỏ hơn (lt)',
                    example: '{{#if (gt total 1000000)}}Khách VIP{{/if}}'
                }
            ],
            systemVariables: [
                {
                    name: 'metadata.templateName',
                    description: 'Tên mẫu báo cáo đang sử dụng'
                },
                {
                    name: 'metadata.generatedAt',
                    description: 'Thời điểm xuất báo cáo'
                },
                {
                    name: 'metadata.userName',
                    description: 'Tên người thực hiện xuất báo cáo'
                },
                {
                    name: 'metadata.totalCount',
                    description: 'Tổng số dòng dữ liệu trong báo cáo'
                }
            ]
        };
    }
}

// Singleton instance
let variableManagerInstance = null;

export function getVariableManagerService() {
    if (!variableManagerInstance) {
        variableManagerInstance = new VariableManagerService();
    }
    return variableManagerInstance;
}
