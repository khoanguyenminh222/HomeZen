import { calculateElectricUsage } from './calculateElectricUsage';
import { calculateWaterUsage } from './calculateWaterUsage';
import { calculateElectricityCost } from './calculateElectricityCost';
import { calculateWaterCost } from './calculateWaterCost';
import { numberToVietnameseText } from './numberToVietnameseText';

/**
 * Tính toán toàn bộ hóa đơn
 * 
 * @param {Object} params - Tham số tính toán
 * @param {string} params.roomId - ID phòng
 * @param {number} params.oldElectricReading - Chỉ số điện cũ
 * @param {number} params.newElectricReading - Chỉ số điện mới
 * @param {number} params.oldWaterReading - Chỉ số nước cũ
 * @param {number} params.newWaterReading - Chỉ số nước mới
 * @param {Object} params.room - Room object với price và maxElectricMeter, maxWaterMeter
 * @param {Object} params.propertyInfo - PropertyInfo với maxElectricMeter, maxWaterMeter (chung)
 * @param {Object} params.utilityRate - UtilityRate (riêng hoặc chung)
 * @param {Array} params.tieredRates - TieredElectricityRate[] (nếu có)
 * @param {number} params.occupantCount - Số người ở (cho tính nước theo người)
 * @param {Array} params.billFees - BillFee[] (các phí phát sinh)
 * @returns {Object} - Kết quả tính toán
 */
export async function calculateBill(params) {
  const {
    roomId,
    oldElectricReading,
    newElectricReading,
    oldWaterReading,
    newWaterReading,
    room,
    propertyInfo,
    utilityRate,
    tieredRates = [],
    occupantCount = 1,
    billFees = [],
  } = params;

  // Lấy max meter cho phòng (riêng hoặc chung)
  const maxElectricMeter = room.maxElectricMeter ?? propertyInfo.maxElectricMeter ?? 999999;
  const maxWaterMeter = room.maxWaterMeter ?? propertyInfo.maxWaterMeter ?? 99999;

  // Tính điện tiêu thụ
  const electricResult = calculateElectricUsage(
    oldElectricReading,
    newElectricReading,
    maxElectricMeter
  );

  // Tính nước tiêu thụ
  const waterResult = calculateWaterUsage(
    oldWaterReading,
    newWaterReading,
    maxWaterMeter
  );

  // Tính tiền điện
  const electricityCost = calculateElectricityCost(
    electricResult.usage,
    utilityRate,
    tieredRates
  );

  // Tính tiền nước
  const waterCost = calculateWaterCost(
    waterResult.usage,
    utilityRate,
    occupantCount
  );

  // Tính tổng phí phát sinh
  const feesTotal = billFees.reduce((sum, fee) => {
    return sum + Number(fee.amount || 0);
  }, 0);

  // Tính tổng tiền
  const roomPrice = Number(room.price || 0);
  const totalCost = roomPrice + electricityCost + waterCost + feesTotal;

  // Chuyển số tiền thành chữ
  const totalCostText = numberToVietnameseText(Math.round(totalCost));

  return {
    // Chỉ số và tiêu thụ
    electricityUsage: electricResult.usage,
    electricityRollover: electricResult.rollover,
    waterUsage: waterResult.usage,
    waterRollover: waterResult.rollover,
    
    // Chi phí
    roomPrice,
    electricityCost,
    waterCost,
    feesTotal,
    totalCost,
    totalCostText,
  };
}
