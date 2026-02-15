import { z } from 'zod';

/**
 * Zod validation schema cho PropertyInfo
 * Validates: Requirements 4.1-4.8
 */
export const propertyInfoSchema = z.object({
  ten: z.string()
    .min(1, 'Tên nhà trọ không được để trống')
    .max(200, 'Tên nhà trọ không được quá 200 ký tự'),

  dia_chi: z.string()
    .min(1, 'Địa chỉ không được để trống')
    .max(500, 'Địa chỉ không được quá 500 ký tự'),

  dien_thoai: z.string()
    .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ (phải là 10-11 số)'),

  ten_chu_nha: z.string()
    .min(1, 'Tên chủ nhà không được để trống')
    .max(200, 'Tên chủ nhà không được quá 200 ký tự'),

  email: z.email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),

  logo_url: z.url('URL logo không hợp lệ')
    .optional()
    .or(z.literal('')),

  max_dong_ho_dien: z.number()
    .int('Giá trị max đồng hồ điện phải là số nguyên')
    .positive('Giá trị max đồng hồ điện phải lớn hơn 0')
    .min(9999, 'Giá trị max đồng hồ điện tối thiểu là 9999 (4 chữ số)')
    .max(9999999, 'Giá trị max đồng hồ điện tối đa là 9999999 (7 chữ số)')
    .default(999999),

  max_dong_ho_nuoc: z.number()
    .int('Giá trị max đồng hồ nước phải là số nguyên')
    .positive('Giá trị max đồng hồ nước phải lớn hơn 0')
    .min(9999, 'Giá trị max đồng hồ nước tối thiểu là 9999 (4 chữ số)')
    .max(9999999, 'Giá trị max đồng hồ nước tối đa là 9999999 (7 chữ số)')
    .default(99999),
});

/**
 * Type cho PropertyInfo input
 * @typedef {z.infer<typeof propertyInfoSchema>} PropertyInfoInput
 */
