import { z } from 'zod';

// Enum cho phương thức tính nước
export const WaterPricingMethodEnum = z.enum(['DONG_HO', 'THEO_NGUOI']);

// Đơn giá điện bậc thang EVN (Quyết định 2699/QĐ-BCT có hiệu lực từ 11/10/2024)
export const EVN_TIERED_RATES = [
  { muc_tieu_thu_min: 0, muc_tieu_thu_max: 50, gia: 1984 },
  { muc_tieu_thu_min: 51, muc_tieu_thu_max: 100, gia: 2050 },
  { muc_tieu_thu_min: 101, muc_tieu_thu_max: 200, gia: 2380 },
  { muc_tieu_thu_min: 201, muc_tieu_thu_max: 300, gia: 2998 },
  { muc_tieu_thu_min: 301, muc_tieu_thu_max: 400, gia: 3350 },
  { muc_tieu_thu_min: 401, muc_tieu_thu_max: null, gia: 3460 },
];

// Helper to safely handle number inputs that could be empty strings or null
const safeNumber = z.preprocess((val) => {
  if (val === '' || val === undefined) return null;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
}, z.number().min(0).nullable().optional());

// Schema cho bậc thang giá điện
export const tieredElectricityRateSchema = z.object({
  muc_tieu_thu_min: z.number().int().min(0, 'Mức tiêu thụ tối thiểu phải >= 0'),
  muc_tieu_thu_max: z.number().int().min(0, 'Mức tiêu thụ tối đa phải >= 0').nullable(),
  gia: safeNumber,
});

// Schema cho đơn giá chung (global utility rates)
export const globalUtilityRateSchema = z.object({
  gia_dien: safeNumber,
  gia_nuoc: safeNumber,
  phuong_thuc_tinh_nuoc: WaterPricingMethodEnum.default('DONG_HO'),
  gia_nuoc_theo_nguoi: safeNumber,
  su_dung_bac_thang: z.boolean().default(false),
  bac_thang_gia: z.array(tieredElectricityRateSchema).optional(),
}).refine((data) => {
  // Nếu tính nước theo người, phải có giá nước theo người
  if (data.phuong_thuc_tinh_nuoc === 'THEO_NGUOI' && !data.gia_nuoc_theo_nguoi) {
    return false;
  }
  // Nếu tính nước theo đồng hồ, phải có giá nước
  if (data.phuong_thuc_tinh_nuoc === 'DONG_HO' && !data.gia_nuoc) {
    return false;
  }
  // Nếu dùng bậc thang, phải có ít nhất 1 bậc
  if (data.su_dung_bac_thang && (!data.bac_thang_gia || data.bac_thang_gia.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Cấu hình đơn giá không hợp lệ',
});

// Schema cho đơn giá riêng từng phòng
export const roomUtilityRateSchema = z.object({
  phong_id: z.cuid({ message: 'ID phòng không hợp lệ' }),
  gia_dien: safeNumber,
  gia_nuoc: safeNumber,
  phuong_thuc_tinh_nuoc: WaterPricingMethodEnum.default('DONG_HO'),
  gia_nuoc_theo_nguoi: safeNumber,
  su_dung_bac_thang: z.boolean().default(false),
  bac_thang_gia: z.array(tieredElectricityRateSchema).optional(),
}).refine((data) => {
  // Nếu tính nước theo người, phải có giá nước theo người
  if (data.phuong_thuc_tinh_nuoc === 'THEO_NGUOI' && !data.gia_nuoc_theo_nguoi) {
    return false;
  }
  // Nếu tính nước theo đồng hồ, phải có giá nước
  if (data.phuong_thuc_tinh_nuoc === 'DONG_HO' && !data.gia_nuoc) {
    return false;
  }
  // Nếu dùng bậc thang, phải có ít nhất 1 bậc
  if (data.su_dung_bac_thang && (!data.bac_thang_gia || data.bac_thang_gia.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Cấu hình đơn giá không hợp lệ',
});

// Schema cho cập nhật đơn giá chung (không dùng partial với refinement)
export const updateGlobalUtilityRateSchema = z.object({
  gia_dien: safeNumber,
  gia_nuoc: safeNumber,
  phuong_thuc_tinh_nuoc: WaterPricingMethodEnum.optional(),
  gia_nuoc_theo_nguoi: safeNumber,
  su_dung_bac_thang: z.boolean().optional(),
  bac_thang_gia: z.array(tieredElectricityRateSchema).optional(),
});

// Schema cho cập nhật đơn giá riêng (không dùng partial với refinement)
export const updateRoomUtilityRateSchema = z.object({
  gia_dien: safeNumber,
  gia_nuoc: safeNumber,
  phuong_thuc_tinh_nuoc: WaterPricingMethodEnum.optional(),
  gia_nuoc_theo_nguoi: safeNumber,
  su_dung_bac_thang: z.boolean().optional(),
  bac_thang_gia: z.array(tieredElectricityRateSchema).optional(),
});

// Validation cho bậc thang giá điện
export const validateTieredRates = (rates) => {
  if (!rates || rates.length === 0) {
    return { isValid: false, error: 'Phải có ít nhất 1 bậc giá điện' };
  }

  // Sắp xếp theo muc_tieu_thu_min
  const sortedRates = [...rates].sort((a, b) => a.muc_tieu_thu_min - b.muc_tieu_thu_min);

  for (let i = 0; i < sortedRates.length; i++) {
    const current = sortedRates[i];
    const next = sortedRates[i + 1];

    // Kiểm tra muc_tieu_thu_max >= muc_tieu_thu_min
    if (current.muc_tieu_thu_max !== null && current.muc_tieu_thu_max <= current.muc_tieu_thu_min) {
      return {
        isValid: false,
        error: `Bậc ${i + 1}: Mức tối đa phải lớn hơn mức tối thiểu`
      };
    }

    // Kiểm tra không có khoảng trống giữa các bậc
    if (next && current.muc_tieu_thu_max !== null && current.muc_tieu_thu_max + 1 !== next.muc_tieu_thu_min) {
      return {
        isValid: false,
        error: `Có khoảng trống giữa bậc ${i + 1} and bậc ${i + 2}`
      };
    }

    // Bậc cuối cùng phải có muc_tieu_thu_max = null (không giới hạn)
    if (i === sortedRates.length - 1 && current.muc_tieu_thu_max !== null) {
      return {
        isValid: false,
        error: 'Bậc cuối cùng phải không giới hạn (để trống mức tối đa)'
      };
    }
  }

  return { isValid: true, sortedRates };
};

// Utility function để tính tiền điện theo bậc thang
export const calculateTieredElectricityCost = (usage, tieredRates) => {
  const breakdown = getTieredElectricityBreakdown(usage, tieredRates);
  return breakdown.reduce((sum, item) => sum + item.cost, 0);
};

// Utility function để lấy chi tiết tính tiền điện theo bậc thang (dùng cho hiển thị hóa đơn)
export const getTieredElectricityBreakdown = (usage, tieredRates) => {
  if (!tieredRates || tieredRates.length === 0) {
    throw new Error('Không có bậc giá điện');
  }

  const validation = validateTieredRates(tieredRates);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const breakdown = [];
  let remainingUsage = usage;

  for (const rate of validation.sortedRates) {
    if (remainingUsage <= 0) break;

    // Tính số kWh trong bậc này
    let tierUsage;
    if (rate.muc_tieu_thu_max === null) {
      // Bậc cuối cùng - không giới hạn
      tierUsage = remainingUsage;
    } else {
      // Tính số kWh có thể sử dụng trong bậc này
      // Ví dụ: Bậc 1 (0-50): 50 - 0 + 1 = 51 (Sai, phải là 50)
      // Thực tế: EVN quy định bậc 1 là 50 số đầu tiên.
      // Nếu min=0, max=50 -> capacity = 50.
      // Nếu min=51, max=100 -> capacity = 100 - 51 + 1 = 50.
      const capacity = rate.muc_tieu_thu_max - rate.muc_tieu_thu_min + (rate.muc_tieu_thu_min === 0 ? 0 : 1);
      tierUsage = Math.min(remainingUsage, capacity);
    }

    const cost = tierUsage * rate.gia;
    breakdown.push({
      range: `${rate.muc_tieu_thu_min}${rate.muc_tieu_thu_max ? `-${rate.muc_tieu_thu_max}` : '+'}`,
      usage: tierUsage,
      unit: 'kWh',
      price: rate.gia,
      cost: cost
    });

    remainingUsage -= tierUsage;
  }

  return breakdown;
};

// Utility function để tính tiền nước theo phương thức
export const calculateWaterCost = (usage, waterPrice, waterPricingMethod, waterPricePerPerson, occupantCount = 1) => {
  if (waterPricingMethod === 'THEO_NGUOI') {
    if (!waterPricePerPerson) {
      throw new Error('Chưa cấu hình giá nước theo người');
    }
    return occupantCount * waterPricePerPerson;
  } else {
    if (!waterPrice) {
      throw new Error('Chưa cấu hình giá nước theo đồng hồ');
    }
    return usage * waterPrice;
  }
};