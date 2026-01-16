import { z } from 'zod';

/**
 * Zod validation schema cho PropertyInfo
 * Validates: Requirements 4.1-4.8
 */
export const propertyInfoSchema = z.object({
  name: z.string()
    .min(1, 'Tên nhà trọ không được để trống')
    .max(200, 'Tên nhà trọ không được quá 200 ký tự'),
  
  address: z.string()
    .min(1, 'Địa chỉ không được để trống')
    .max(500, 'Địa chỉ không được quá 500 ký tự'),
  
  phone: z.string()
    .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ (phải là 10-11 số)'),
  
  ownerName: z.string()
    .min(1, 'Tên chủ nhà không được để trống')
    .max(200, 'Tên chủ nhà không được quá 200 ký tự'),
  
  email: z.string()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
  
  logoUrl: z.string()
    .url('URL logo không hợp lệ')
    .optional()
    .or(z.literal('')),
});

/**
 * Type cho PropertyInfo input
 * @typedef {z.infer<typeof propertyInfoSchema>} PropertyInfoInput
 */
