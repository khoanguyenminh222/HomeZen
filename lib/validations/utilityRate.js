import { z } from 'zod';

// Enum cho phương thức tính nước
export const WaterPricingMethodEnum = z.enum(['METER', 'PERSON']);

// Schema cho bậc thang giá điện
export const tieredElectricityRateSchema = z.object({
  minUsage: z.number().int().min(0, 'Mức tiêu thụ tối thiểu phải >= 0'),
  maxUsage: z.number().int().min(0, 'Mức tiêu thụ tối đa phải >= 0').nullable(),
  price: z.number().min(0, 'Giá điện phải >= 0'),
});

// Schema cho đơn giá chung (global utility rates)
export const globalUtilityRateSchema = z.object({
  electricityPrice: z.number().min(0, 'Giá điện phải >= 0').nullable(),
  waterPrice: z.number().min(0, 'Giá nước phải >= 0').nullable(),
  waterPricingMethod: WaterPricingMethodEnum.default('METER'),
  waterPricePerPerson: z.number().min(0, 'Giá nước theo người phải >= 0').nullable(),
  useTieredPricing: z.boolean().default(false),
  tieredRates: z.array(tieredElectricityRateSchema).optional(),
}).refine((data) => {
  // Nếu tính nước theo người, phải có giá nước theo người
  if (data.waterPricingMethod === 'PERSON' && !data.waterPricePerPerson) {
    return false;
  }
  // Nếu tính nước theo đồng hồ, phải có giá nước
  if (data.waterPricingMethod === 'METER' && !data.waterPrice) {
    return false;
  }
  // Nếu dùng bậc thang, phải có ít nhất 1 bậc
  if (data.useTieredPricing && (!data.tieredRates || data.tieredRates.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Cấu hình đơn giá không hợp lệ',
});

// Schema cho đơn giá riêng từng phòng
export const roomUtilityRateSchema = z.object({
  roomId: z.cuid({ message: 'ID phòng không hợp lệ' }),
  electricityPrice: z.number().min(0, { message: 'Giá điện phải >= 0' }).nullable(),
  waterPrice: z.number().min(0, { message: 'Giá nước phải >= 0' }).nullable(),
  waterPricingMethod: WaterPricingMethodEnum.default('METER'),
  waterPricePerPerson: z.number().min(0, { message: 'Giá nước theo người phải >= 0' }).nullable(),
  useTieredPricing: z.boolean().default(false),
  tieredRates: z.array(tieredElectricityRateSchema).optional(),
}).refine((data) => {
  // Nếu tính nước theo người, phải có giá nước theo người
  if (data.waterPricingMethod === 'PERSON' && !data.waterPricePerPerson) {
    return false;
  }
  // Nếu tính nước theo đồng hồ, phải có giá nước
  if (data.waterPricingMethod === 'METER' && !data.waterPrice) {
    return false;
  }
  // Nếu dùng bậc thang, phải có ít nhất 1 bậc
  if (data.useTieredPricing && (!data.tieredRates || data.tieredRates.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Cấu hình đơn giá không hợp lệ',
});

// Schema cho cập nhật đơn giá chung (không dùng partial với refinement)
export const updateGlobalUtilityRateSchema = z.object({
  electricityPrice: z.number().min(0, 'Giá điện phải >= 0').nullable().optional(),
  waterPrice: z.number().min(0, 'Giá nước phải >= 0').nullable().optional(),
  waterPricingMethod: WaterPricingMethodEnum.optional(),
  waterPricePerPerson: z.number().min(0, 'Giá nước theo người phải >= 0').nullable().optional(),
  useTieredPricing: z.boolean().optional(),
  tieredRates: z.array(tieredElectricityRateSchema).optional(),
});

// Schema cho cập nhật đơn giá riêng (không dùng partial với refinement)
export const updateRoomUtilityRateSchema = z.object({
  electricityPrice: z.number().min(0, 'Giá điện phải >= 0').nullable().optional(),
  waterPrice: z.number().min(0, 'Giá nước phải >= 0').nullable().optional(),
  waterPricingMethod: WaterPricingMethodEnum.optional(),
  waterPricePerPerson: z.number().min(0, 'Giá nước theo người phải >= 0').nullable().optional(),
  useTieredPricing: z.boolean().optional(),
  tieredRates: z.array(tieredElectricityRateSchema).optional(),
});

// Validation cho bậc thang giá điện
export const validateTieredRates = (rates) => {
  if (!rates || rates.length === 0) {
    return { isValid: false, error: 'Phải có ít nhất 1 bậc giá điện' };
  }

  // Sắp xếp theo minUsage
  const sortedRates = [...rates].sort((a, b) => a.minUsage - b.minUsage);

  for (let i = 0; i < sortedRates.length; i++) {
    const current = sortedRates[i];
    const next = sortedRates[i + 1];

    // Kiểm tra maxUsage >= minUsage
    if (current.maxUsage !== null && current.maxUsage <= current.minUsage) {
      return { 
        isValid: false, 
        error: `Bậc ${i + 1}: Mức tối đa phải lớn hơn mức tối thiểu` 
      };
    }

    // Kiểm tra không có khoảng trống giữa các bậc
    if (next && current.maxUsage !== null && current.maxUsage + 1 !== next.minUsage) {
      return { 
        isValid: false, 
        error: `Có khoảng trống giữa bậc ${i + 1} và bậc ${i + 2}` 
      };
    }

    // Bậc cuối cùng phải có maxUsage = null (không giới hạn)
    if (i === sortedRates.length - 1 && current.maxUsage !== null) {
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
  if (!tieredRates || tieredRates.length === 0) {
    throw new Error('Không có bậc giá điện');
  }

  const validation = validateTieredRates(tieredRates);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  let totalCost = 0;
  let remainingUsage = usage;

  for (const rate of validation.sortedRates) {
    if (remainingUsage <= 0) break;

    // Tính số kWh trong bậc này
    let tierUsage;
    if (rate.maxUsage === null) {
      // Bậc cuối cùng - không giới hạn
      tierUsage = remainingUsage;
    } else {
      // Tính số kWh có thể sử dụng trong bậc này
      // Bậc từ minUsage+1 đến maxUsage (inclusive)
      // Ví dụ: bậc {minUsage: 0, maxUsage: 50} có 50 kWh (kWh 1-50)
      // Bậc {minUsage: 51, maxUsage: 100} có 50 kWh (kWh 51-100)
      const tierCapacity = rate.maxUsage - rate.minUsage;
      tierUsage = Math.min(remainingUsage, tierCapacity);
    }

    totalCost += tierUsage * rate.price;
    remainingUsage -= tierUsage;
  }

  return totalCost;
};

// Utility function để tính tiền nước theo phương thức
export const calculateWaterCost = (usage, waterPrice, waterPricingMethod, waterPricePerPerson, occupantCount = 1) => {
  if (waterPricingMethod === 'PERSON') {
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