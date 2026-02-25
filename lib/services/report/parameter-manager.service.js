import { getParameterValidator } from './parameter-validator';
import { getTypeTransformer } from './type-transformer';

/**
 * Parameter Manager Service
 * Điều phối quy trình xử lý tham số động
 * Requirements: 2.1, 2.2, 3.6, 5.2, 5.3, 5.4, 8.3, 8.4
 */
export class ParameterManager {
    constructor() {
        this.validator = getParameterValidator();
        this.transformer = getTypeTransformer();
    }

    /**
     * Parse cấu hình JSON và validate cấu trúc
     * Requirement 8.4
     */
    parseConfiguration(configJson) {
        if (!configJson) return { parameters: [] };
        try {
            const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
            if (!config.parameters || !Array.isArray(config.parameters)) {
                throw new Error('Cấu hình không hợp lệ: thiếu mảng parameters');
            }
            return config;
        } catch (e) {
            console.error('Error parsing parameter config:', e);
            return { parameters: [] }; // Trả về mặc định an toàn
        }
    }

    /**
     * Áp dụng các giá trị mặc định dựa trên keyword (TODAY, ...)
     * Requirement 5.2, 5.3, 5.4, 5.5
     */
    applyDefaults(config) {
        const values = {};
        const now = new Date();

        config.parameters.forEach(param => {
            let defaultValue = param.defaultValue;

            if (defaultValue === 'none') {
                defaultValue = '';
            } else if (defaultValue === 'TODAY') {
                defaultValue = now.toISOString().split('T')[0];
            } else if (defaultValue === 'FIRST_DAY_OF_MONTH') {
                defaultValue = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            } else if (defaultValue === 'LAST_DAY_OF_MONTH') {
                defaultValue = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (defaultValue === 'CURRENT_MONTH') {
                defaultValue = (now.getMonth() + 1).toString();
            } else if (defaultValue === 'CURRENT_YEAR') {
                defaultValue = now.getFullYear().toString();
            }

            values[param.name] = defaultValue !== undefined ? defaultValue : '';
        });

        return values;
    }

    /**
     * Thu thập, validate và transform tham số
     * Requirement 2.1, 3.6, 9.1
     */
    async processParameters(rawValues, config) {
        // 1. Validate
        const validationErrors = [];
        config.parameters.forEach(param => {
            const value = rawValues[param.name];
            const errors = this.validator.validateParameter(value, param);
            if (errors.length > 0) {
                validationErrors.push(...errors);
            }
        });

        // 2. Validate Date Range (Metadata)
        config.parameters.forEach(param => {
            if (param.metadata?.pairedWith && param.metadata?.rangeType === 'start') {
                const startVal = rawValues[param.name];
                const endVal = rawValues[param.metadata.pairedWith];
                const endDef = config.parameters.find(p => p.name === param.metadata.pairedWith);

                if (startVal && endVal && endDef) {
                    const rangeErrors = this.validator.validateDateRange(startVal, endVal, param, endDef);
                    validationErrors.push(...rangeErrors);
                }
            }
        });

        if (validationErrors.length > 0) {
            return {
                success: false,
                errors: validationErrors
            };
        }

        // 3. Transform
        const transformedValues = {};
        config.parameters.forEach(param => {
            const value = rawValues[param.name];
            try {
                transformedValues[param.name] = this.transformer.transformByType(value, param.displayType);
            } catch (e) {
                validationErrors.push({
                    parameterName: param.name,
                    message: e.message
                });
            }
        });

        if (validationErrors.length > 0) {
            return {
                success: false,
                errors: validationErrors
            };
        }

        return {
            success: true,
            data: transformedValues
        };
    }

    /**
     * Chuẩn bị tham số để truyền vào stored procedure
     * Requirement 2.2
     */
    prepareForExecution(transformedValues) {
        return { ...transformedValues };
    }
}

let managerInstance = null;
export function getParameterManager() {
    if (!managerInstance) managerInstance = new ParameterManager();
    return managerInstance;
}
