/**
 * Tính tiền nước (theo đồng hồ hoặc theo số người)
 * 
 * @param {number} usage - Số m³ tiêu thụ (nếu tính theo đồng hồ)
 * @param {Object} utilityRate - Đơn giá điện nước
 * @param {number} occupantCount - Số người ở (nếu tính theo người)
 * @returns {number} - Tiền nước (VNĐ)
 */
export function calculateWaterCost(usage, utilityRate, occupantCount = 1) {
  if (!utilityRate) {
    throw new Error('Chưa cấu hình đơn giá nước');
  }

  if (utilityRate.waterPricingMethod === 'PERSON') {
    // Tính theo số người
    if (!utilityRate.waterPricePerPerson) {
      throw new Error('Chưa cấu hình giá nước theo người');
    }
    if (occupantCount < 1) {
      throw new Error('Số người ở phải >= 1');
    }
    const pricePerPerson = Number(utilityRate.waterPricePerPerson);
    return occupantCount * pricePerPerson;
  } else {
    // Tính theo đồng hồ
    if (usage < 0) {
      throw new Error('Số m³ tiêu thụ không được âm');
    }
    if (!utilityRate.waterPrice) {
      throw new Error('Chưa cấu hình giá nước theo đồng hồ');
    }
    const price = Number(utilityRate.waterPrice);
    return usage * price;
  }
}
