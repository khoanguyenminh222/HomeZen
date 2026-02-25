/**
 * Type Transformer
 * Chuyển đổi dữ liệu từ UI sang định dạng phù hợp với Stored Procedure
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.3
 */
export class TypeTransformer {
    /**
     * Chuyển đổi giá trị dựa trên loại hiển thị
     */
    transformByType(value, displayType) {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        switch (displayType) {
            case 'DATE':
                return this.transformDate(value);
            case 'NUMBER':
                return this.transformNumber(value);
            case 'ROOM_SELECT':
                return this.transformRoomSelect(value);
            case 'MULTI_SELECT':
                return this.transformMultiSelect(value);
            case 'TEXT':
            default:
                return this.transformText(value);
        }
    }

    /**
     * Chuyển đổi ngày sang định dạng ISO 8601 (YYYY-MM-DD)
     * Requirement 9.1
     */
    transformDate(value) {
        if (!value) return null;
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            return date.toISOString().split('T')[0];
        } catch (e) {
            throw new Error(`Không thể chuyển đổi "${value}" sang định dạng ngày.`);
        }
    }

    /**
     * Chuyển đổi chuỗi sang số
     * Requirement 9.2
     */
    transformNumber(value) {
        if (typeof value === 'number') return value;
        const num = Number(value);
        if (isNaN(num)) {
            throw new Error(`Không thể chuyển đổi "${value}" sang kiểu số.`);
        }
        return num;
    }

    /**
     * Cắt bỏ khoảng trắng thừa cho văn bản
     * Requirement 9.3
     */
    transformText(value) {
        return String(value).trim();
    }

    /**
     * Chuyển đổi room selection (thường là ID)
     * Requirement 9.4
     */
    transformRoomSelect(value) {
        // Thường room ID là số hoặc UUID
        if (!isNaN(value) && value !== '') return Number(value);
        return value;
    }

    /**
     * Chuyển đổi mảng chọn nhiều sang chuỗi ngăn cách bởi dấu phẩy
     * Requirement 10.3
     */
    transformMultiSelect(values) {
        if (!Array.isArray(values)) {
            if (!values) return null;
            return String(values);
        }
        return values.join(',');
    }
}

let transformerInstance = null;
export function getTypeTransformer() {
    if (!transformerInstance) transformerInstance = new TypeTransformer();
    return transformerInstance;
}
