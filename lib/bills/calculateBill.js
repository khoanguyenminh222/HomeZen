import { calculateElectricUsage } from './calculateElectricUsage';
import { calculateWaterUsage } from './calculateWaterUsage';
import { calculateElectricityCost } from './calculateElectricityCost';
import { calculateWaterCost } from './calculateWaterCost';
import { numberToVietnameseText } from './numberToVietnameseText';

/**
 * Tính toán toàn bộ hóa đơn
 * 
 * @param {Object} params - Tham số tính toán
 * @param {string} params.phong_id - ID phòng
 * @param {number} params.chi_so_dien_cu - Chỉ số điện cũ
 * @param {number} params.chi_so_dien_moi - Chỉ số điện mới
 * @param {number} params.chi_so_nuoc_cu - Chỉ số nước cũ
 * @param {number} params.chi_so_nuoc_moi - Chỉ số nước mới
 * @param {Object} params.room - Room object với gia_phong và max_dong_ho_dien, max_dong_ho_nuoc
 * @param {Object} params.propertyInfo - PropertyInfo với max_dong_ho_dien, max_dong_ho_nuoc (chung)
 * @param {Object} params.utilityRate - UtilityRate (riêng hoặc chung)
 * @param {Array} params.bac_thang_gia - PRP_BAC_THANG_GIA_DIEN[] (nếu có)
 * @param {number} params.occupantCount - Số người ở (cho tính nước theo người)
 * @param {Array} params.billFees - BillFee[] (các phí phát sinh)
 * @returns {Object} - Kết quả tính toán
 */
export async function calculateBill(params) {
  const {
    phong_id,
    chi_so_dien_cu,
    chi_so_dien_moi,
    chi_so_nuoc_cu,
    chi_so_nuoc_moi,
    room,
    propertyInfo,
    utilityRate,
    bac_thang_gia = [],
    occupantCount = 1,
    billFees = [],
  } = params;

  // Lấy max meter cho phòng (riêng hoặc chung)
  const maxElectricMeter = room.max_dong_ho_dien ?? propertyInfo.max_dong_ho_dien ?? 999999;
  const maxWaterMeter = room.max_dong_ho_nuoc ?? propertyInfo.max_dong_ho_nuoc ?? 99999;

  // Tính điện tiêu thụ
  const electricResult = calculateElectricUsage(
    chi_so_dien_cu,
    chi_so_dien_moi,
    maxElectricMeter
  );

  // Tính nước tiêu thụ
  const waterResult = calculateWaterUsage(
    chi_so_nuoc_cu,
    chi_so_nuoc_moi,
    maxWaterMeter
  );

  // Tính tiền điện
  const electricityResult = calculateElectricityCost(
    electricResult.usage,
    utilityRate,
    bac_thang_gia
  );
  const electricityCost = electricityResult.cost;
  const electricityBreakdown = electricityResult.breakdown;

  // Tính tiền nước
  const waterResultObj = calculateWaterCost(
    waterResult.usage,
    utilityRate,
    occupantCount
  );
  const waterCost = waterResultObj.cost;
  const waterBreakdown = waterResultObj.breakdown;

  // Tính tổng phí phát sinh
  const feesTotal = billFees.reduce((sum, fee) => {
    return sum + Number(fee.so_tien || 0);
  }, 0);

  // Tính tổng tiền
  const roomPrice = Number(room.gia_phong || 0);
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
    electricityBreakdown,
    waterCost,
    waterBreakdown,
    feesTotal,
    totalCost,
    totalCostText,
  };
}
