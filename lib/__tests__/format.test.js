import { formatCurrency, formatDate } from '../format';

describe('Format Utilities', () => {
    describe('formatCurrency', () => {
        test('should format numbers to VND', () => {
            // Note: Intl formatting might vary slightly across environments (spaces, dots)
            // but should follow vi-VN locale rules.
            const result = formatCurrency(2000000);
            expect(result).toMatch(/2\.000\.000/);
            expect(result).toMatch(/₫/);
        });

        test('should return "Chưa có" for null or undefined', () => {
            expect(formatCurrency(null)).toBe('Chưa có');
            expect(formatCurrency(undefined)).toBe('Chưa có');
        });

        test('should format 0 correctly', () => {
            const result = formatCurrency(0);
            expect(result).toMatch(/0/);
            expect(result).toMatch(/₫/);
        });
    });

    describe('formatDate', () => {
        test('should format date strings to vi-VN', () => {
            const result = formatDate('2024-01-19');
            // vi-VN usually formats as d/m/yyyy or dd/mm/yyyy
            expect(result).toMatch(/19\/1\/2024|19\/01\/2024/);
        });

        test('should return "Chưa có" for falsy values', () => {
            expect(formatDate(null)).toBe('Chưa có');
            expect(formatDate('')).toBe('Chưa có');
            expect(formatDate(undefined)).toBe('Chưa có');
        });

        test('should return error message for invalid dates', () => {
            expect(formatDate('invalid-date')).toBe('Ngày không hợp lệ');
        });
    });
});
