/**
 * Utility functions for formatting data
 */

/**
 * Format number to Vietnamese Currency (VND)
 * @param {number|null|undefined} amount - The amount to format
 * @returns {string} Formatted currency string or "Chưa có" if amount is null/undefined
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'Chưa có';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

/**
 * Format date string to Vietnamese date format (dd/mm/yyyy)
 * @param {string|Date|null|undefined} dateString - The date to format
 * @returns {string} Formatted date string or "Chưa có" if date is null/undefined
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
        return date.toLocaleDateString('vi-VN');
    } catch (error) {
        return 'Lỗi ngày';
    }
};
