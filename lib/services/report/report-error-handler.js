/**
 * Report Error Handler
 * Quản lý các thông điệp lỗi tiếng Việt thân thiện
 * Requirements: 7.1, 7.3, 7.4, 7.5
 */
export class ReportErrorHandler {
    /**
     * Định dạng thông điệp lỗi dựa trên loại lỗi
     */
    static formatValidationErrors(errors) {
        if (!errors || errors.length === 0) return '';
        return errors.map(err => err.message).join('\n');
    }

    /**
     * Chuyển đổi lỗi hệ thống sang thông điệp tiếng Việt
     */
    static getFriendlyMessage(error) {
        const message = error.message || String(error);

        if (message.includes('required') || message.includes('bắt buộc')) {
            return 'Vui lòng điền đầy đủ các tham số bắt buộc.';
        }
        if (message.includes('date') || message.includes('ngày')) {
            return 'Định dạng ngày không hợp lệ hoặc khoảng ngày không đúng.';
        }
        if (message.includes('number') || message.includes('số')) {
            return 'Giá trị nhập vào phải là số hợp lệ.';
        }

        return `Lỗi hệ thống: ${message}`;
    }
}
