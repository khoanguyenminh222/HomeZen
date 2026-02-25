/**
 * Parameter Validator
 * Kiểm tra tính hợp lệ của tham số dựa trên cấu hình
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 10.4
 */
export class ParameterValidator {
    /**
     * Kiểm tra một tham số cụ thể
     */
    validateParameter(value, definition) {
        const { required, label, name, validation, displayType } = definition;
        const errors = [];

        // 1. Kiểm tra bắt buộc (Requirement 4.2)
        if (required && (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0))) {
            errors.push({
                parameterName: name,
                message: `Tham số "${label || name}" là bắt buộc.`
            });
            return errors; // Nếu thiếu bắt buộc thì không cần kiểm tra thêm các quy tắc khác
        }

        // Nếu không có giá trị và không bắt buộc thì bỏ qua các bước sau
        if (value === null || value === undefined || value === '') {
            return errors;
        }

        // 2. Kiểm tra theo loại (Requirement 3.3, 3.4)
        if (displayType === 'NUMBER') {
            const numError = this.validateNumber(value, definition);
            if (numError) errors.push(numError);
        } else if (displayType === 'DATE') {
            const dateError = this.validateDate(value, definition);
            if (dateError) errors.push(dateError);
        } else if (displayType === 'TEXT') {
            const textError = this.validateText(value, definition);
            if (textError) errors.push(textError);
        } else if (displayType === 'MULTI_SELECT') {
            const multiError = this.validateMultiSelect(value, definition);
            if (multiError) errors.push(multiError);
        }

        return errors;
    }

    /**
     * Kiểm tra ngày (Requirement 3.3)
     */
    validateDate(value, definition) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" không phải là ngày hợp lệ.`
            };
        }

        // Kiểm tra minDate, maxDate nếu có
        const rules = definition.validation || {};
        if (rules.minDate && new Date(value) < new Date(rules.minDate)) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" phải sau ngày ${rules.minDate}.`
            };
        }
        if (rules.maxDate && new Date(value) > new Date(rules.maxDate)) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" phải trước ngày ${rules.maxDate}.`
            };
        }

        return null;
    }

    /**
     * Kiểm tra khoảng ngày (Requirement 3.3)
     */
    validateDateRange(startValue, endValue, startDef, endDef) {
        const errors = [];
        if (!startValue || !endValue) return errors;

        if (new Date(startValue) > new Date(endValue)) {
            errors.push({
                parameterName: startDef.name,
                message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
            });
        }
        return errors;
    }

    /**
     * Kiểm tra số (Requirement 3.4)
     */
    validateNumber(value, definition) {
        const num = Number(value);
        if (isNaN(num)) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" phải là một số hợp lệ.`
            };
        }

        const rules = definition.validation || {};
        if (rules.min !== undefined && num < rules.min) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" không được nhỏ hơn ${rules.min}.`
            };
        }
        if (rules.max !== undefined && num > rules.max) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" không được lớn hơn ${rules.max}.`
            };
        }

        return null;
    }

    /**
     * Kiểm tra văn bản
     */
    validateText(value, definition) {
        const text = String(value);
        const rules = definition.validation || {};

        if (rules.minLength && text.length < rules.minLength) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" phải có ít nhất ${rules.minLength} ký tự.`
            };
        }
        if (rules.maxLength && text.length > rules.maxLength) {
            return {
                parameterName: definition.name,
                message: `"${definition.label || definition.name}" không được vượt quá ${rules.maxLength} ký tự.`
            };
        }
        if (rules.pattern) {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(text)) {
                return {
                    parameterName: definition.name,
                    message: rules.message || `"${definition.label || definition.name}" không đúng định dạng.`
                };
            }
        }

        return null;
    }

    /**
     * Kiểm tra chọn nhiều (Requirement 10.4)
     */
    validateMultiSelect(values, definition) {
        if (!Array.isArray(values)) {
            return {
                parameterName: definition.name,
                message: `Dữ liệu cho "${definition.label || definition.name}" phải là một danh sách.`
            };
        }

        const rules = definition.validation || {};
        if (definition.required && values.length === 0) {
            return {
                parameterName: definition.name,
                message: `Vui lòng chọn ít nhất một giá trị cho "${definition.label || definition.name}".`
            };
        }

        if (rules.maxSelections && values.length > rules.maxSelections) {
            return {
                parameterName: definition.name,
                message: `Chỉ được chọn tối đa ${rules.maxSelections} giá trị cho "${definition.label || definition.name}".`
            };
        }

        return null;
    }
}

let validatorInstance = null;
export function getParameterValidator() {
    if (!validatorInstance) validatorInstance = new ParameterValidator();
    return validatorInstance;
}
