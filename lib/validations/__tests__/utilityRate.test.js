import { 
  validateTieredRates, 
  calculateTieredElectricityCost, 
  calculateWaterCost 
} from '../utilityRate';

describe('Utility Rate Validation', () => {
  describe('validateTieredRates', () => {
    test('should validate correct tiered rates', () => {
      const rates = [
        { minUsage: 0, maxUsage: 50, price: 1500 },
        { minUsage: 51, maxUsage: 100, price: 2000 },
        { minUsage: 101, maxUsage: null, price: 2500 }
      ];

      const result = validateTieredRates(rates);
      expect(result.isValid).toBe(true);
      expect(result.sortedRates).toHaveLength(3);
    });

    test('should reject empty rates', () => {
      const result = validateTieredRates([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Phải có ít nhất 1 bậc giá điện');
    });

    test('should reject rates with gaps', () => {
      const rates = [
        { minUsage: 0, maxUsage: 50, price: 1500 },
        { minUsage: 52, maxUsage: 100, price: 2000 } // Gap between 50 and 52
      ];

      const result = validateTieredRates(rates);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('khoảng trống');
    });

    test('should reject rates where maxUsage <= minUsage', () => {
      const rates = [
        { minUsage: 50, maxUsage: 40, price: 1500 } // maxUsage < minUsage
      ];

      const result = validateTieredRates(rates);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Mức tối đa phải lớn hơn mức tối thiểu');
    });

    test('should require last tier to have null maxUsage', () => {
      const rates = [
        { minUsage: 0, maxUsage: 50, price: 1500 },
        { minUsage: 51, maxUsage: 100, price: 2000 } // Last tier should have null maxUsage
      ];

      const result = validateTieredRates(rates);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Bậc cuối cùng phải không giới hạn');
    });
  });

  describe('calculateTieredElectricityCost', () => {
    const tieredRates = [
      { minUsage: 0, maxUsage: 50, price: 1500 },
      { minUsage: 51, maxUsage: 100, price: 2000 },
      { minUsage: 101, maxUsage: null, price: 2500 }
    ];

    test('should calculate cost for usage within first tier', () => {
      const cost = calculateTieredElectricityCost(30, tieredRates);
      expect(cost).toBe(30 * 1500); // 45,000
    });

    test('should calculate cost for usage spanning multiple tiers', () => {
      const cost = calculateTieredElectricityCost(120, tieredRates);
      // Tier 1 (0-50): 50 kWh * 1500 = 75,000
      // Tier 2 (51-100): 49 kWh * 2000 = 98,000  
      // Tier 3 (101-120): 21 kWh * 2500 = 52,500
      // Total: 225,500
      expect(cost).toBe(225500);
    });

    test('should calculate cost for exact tier boundary', () => {
      const cost = calculateTieredElectricityCost(100, tieredRates);
      // Tier 1 (0-50): 50 kWh * 1500 = 75,000
      // Tier 2 (51-100): 49 kWh * 2000 = 98,000
      // Tier 3 (101): 1 kWh * 2500 = 2,500
      // Total: 175,500
      expect(cost).toBe(175500);
    });

    test('should throw error for invalid tiered rates', () => {
      expect(() => {
        calculateTieredElectricityCost(100, []);
      }).toThrow('Không có bậc giá điện');
    });
  });

  describe('calculateWaterCost', () => {
    test('should calculate water cost by meter', () => {
      const cost = calculateWaterCost(5, 25000, 'METER', null, 3);
      expect(cost).toBe(5 * 25000); // 125,000
    });

    test('should calculate water cost by person', () => {
      const cost = calculateWaterCost(0, null, 'PERSON', 100000, 3);
      expect(cost).toBe(3 * 100000); // 300,000
    });

    test('should throw error when meter method but no water price', () => {
      expect(() => {
        calculateWaterCost(5, null, 'METER', null, 3);
      }).toThrow('Chưa cấu hình giá nước theo đồng hồ');
    });

    test('should throw error when person method but no price per person', () => {
      expect(() => {
        calculateWaterCost(0, 25000, 'PERSON', null, 3);
      }).toThrow('Chưa cấu hình giá nước theo người');
    });
  });
});