import { calculateTieredElectricityCost } from '@/lib/validations/utilityRate';

/**
 * Tính tiền điện (bậc thang hoặc cố định)
 * 
 * @param {number} usage - Số kWh tiêu thụ
 * @param {Object} utilityRate - Đơn giá điện nước
 * @param {Array} tieredRates - Danh sách bậc thang (nếu có)
 * @returns {number} - Tiền điện (VNĐ)
 */
export function calculateElectricityCost(usage, utilityRate, tieredRates = []) {
  if (usage < 0) {
    throw new Error('Số kWh tiêu thụ không được âm');
  }

  if (!utilityRate) {
    throw new Error('Chưa cấu hình đơn giá điện');
  }

  // Nếu dùng bậc thang
  if (utilityRate.useTieredPricing && tieredRates && tieredRates.length > 0) {
    return calculateTieredElectricityCost(usage, tieredRates);
  }

  // Nếu dùng giá cố định
  if (!utilityRate.electricityPrice) {
    throw new Error('Chưa cấu hình giá điện');
  }

  const price = Number(utilityRate.electricityPrice);
  return usage * price;
}
