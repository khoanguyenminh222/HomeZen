import { getTieredElectricityBreakdown } from '@/lib/validations/utilityRate';

/**
 * Tính tiền điện (bậc thang hoặc cố định)
 * 
 * @param {number} usage - Số kWh tiêu thụ
 * @param {Object} utilityRate - Đơn giá điện nước
 * @param {Array} tieredRates - Danh sách bậc thang (nếu có)
 * @returns {Object} - { cost: number, breakdown: Array }
 */
export function calculateElectricityCost(usage, utilityRate, tieredRates = []) {
  if (usage < 0) {
    throw new Error('Số kWh tiêu thụ không được âm');
  }

  if (!utilityRate) {
    throw new Error('Chưa cấu hình đơn giá điện');
  }

  // Nếu dùng bậc thang
  if (utilityRate.su_dung_bac_thang && tieredRates && tieredRates.length > 0) {
    const breakdown = getTieredElectricityBreakdown(usage, tieredRates);
    const cost = breakdown.reduce((sum, item) => sum + item.cost, 0);
    return { cost, breakdown };
  }

  // Nếu dùng giá cố định
  if (!utilityRate.gia_dien) {
    throw new Error('Chưa cấu hình giá điện');
  }

  const price = Number(utilityRate.gia_dien);
  const cost = usage * price;
  return {
    cost,
    breakdown: [{ range: 'Cố định', usage, unit: 'kWh', price, cost }]
  };
}
