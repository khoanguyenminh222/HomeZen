/**
 * Convert number to Vietnamese text
 * Used for displaying bill amounts in words
 * 
 * @param {number} num - Number to convert
 * @returns {string} - Vietnamese text representation
 */
export function numberToVietnameseText(num) {
    if (typeof num !== 'number' || num < 0) {
        return '';
    }

    if (num === 0) {
        return 'Không đồng';
    }

    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

    function convertLessThanThousand(n) {
        if (n === 0) return '';

        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        const ten = Math.floor(remainder / 10);
        const one = remainder % 10;

        let result = '';

        if (hundred > 0) {
            result += ones[hundred] + ' trăm';
            if (remainder > 0 && remainder < 10) {
                result += ' lẻ';
            }
        }

        if (ten > 1) {
            result += (result ? ' ' : '') + tens[ten];
            if (one === 1) {
                result += ' mốt';
            } else if (one === 5 && ten > 0) {
                result += ' lăm';
            } else if (one > 0) {
                result += ' ' + ones[one];
            }
        } else if (ten === 1) {
            result += (result ? ' ' : '') + 'mười';
            if (one === 5) {
                result += ' lăm';
            } else if (one > 0) {
                result += ' ' + ones[one];
            }
        } else if (one > 0) {
            result += (result ? ' ' : '') + ones[one];
        }

        return result;
    }

    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;

    let result = '';

    if (billion > 0) {
        result += convertLessThanThousand(billion) + ' tỷ';
    }

    if (million > 0) {
        result += (result ? ' ' : '') + convertLessThanThousand(million) + ' triệu';
    }

    if (thousand > 0) {
        result += (result ? ' ' : '') + convertLessThanThousand(thousand) + ' nghìn';
    }

    if (remainder > 0) {
        result += (result ? ' ' : '') + convertLessThanThousand(remainder);
    }

    // Capitalize first letter and add currency
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';

    return result;
}
