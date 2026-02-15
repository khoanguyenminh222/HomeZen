import { z } from 'zod';

/**
 * Zod validation schema cho Room
 * Requirements: 2.1-2.11, 11.2, 11.3
 */

// Enum cho trạng thái phòng
export const RoomStatusEnum = z.enum(['TRONG', 'DA_THUE']);

// Schema cho tạo phòng mới
export const createRoomSchema = z.object({
  ma_phong: z.string()
    .min(1, 'Mã phòng không được để trống')
    .max(20, 'Mã phòng không được quá 20 ký tự')
    .regex(/^[A-Za-z0-9]+$/, 'Mã phòng chỉ được chứa chữ cái và số'),

  ten_phong: z.string()
    .min(1, 'Tên phòng không được để trống')
    .max(100, 'Tên phòng không được quá 100 ký tự'),

  gia_phong: z.number()
    .positive('Giá phòng phải là số dương')
    .int('Giá phòng phải là số nguyên')
    .min(0, 'Giá phòng không được âm')
    .max(999999999, 'Giá phòng không được quá 999,999,999 VNĐ'),

  trang_thai: RoomStatusEnum.optional().default('TRONG'),

  ngay_chot_so: z.number()
    .int('Ngày chốt số phải là số nguyên')
    .min(1, 'Ngày chốt số phải từ 1 đến 31')
    .max(31, 'Ngày chốt số phải từ 1 đến 31')
    .optional()
    .nullable(),

  max_dong_ho_dien: z.number()
    .int('Giá trị max đồng hồ điện phải là số nguyên')
    .positive('Giá trị max đồng hồ điện phải lớn hơn 0')
    .min(9999, 'Giá trị max đồng hồ điện tối thiểu là 9999 (4 chữ số)')
    .max(9999999, 'Giá trị max đồng hồ điện tối đa là 9999999 (7 chữ số)')
    .optional()
    .nullable(),

  max_dong_ho_nuoc: z.number()
    .int('Giá trị max đồng hồ nước phải là số nguyên')
    .positive('Giá trị max đồng hồ nước phải lớn hơn 0')
    .min(9999, 'Giá trị max đồng hồ nước tối thiểu là 9999 (4 chữ số)')
    .max(9999999, 'Giá trị max đồng hồ nước tối đa là 9999999 (7 chữ số)')
    .optional()
    .nullable(),
});

// Schema cho cập nhật phòng
export const updateRoomSchema = z.object({
  ma_phong: z.string()
    .min(1, 'Mã phòng không được để trống')
    .max(20, 'Mã phòng không được quá 20 ký tự')
    .regex(/^[A-Za-z0-9]+$/, 'Mã phòng chỉ được chứa chữ cái và số')
    .optional(),

  ten_phong: z.string()
    .min(1, 'Tên phòng không được để trống')
    .max(100, 'Tên phòng không được quá 100 ký tự')
    .optional(),

  gia_phong: z.number()
    .positive('Giá phòng phải là số dương')
    .int('Giá phòng phải là số nguyên')
    .min(0, 'Giá phòng không được âm')
    .max(999999999, 'Giá phòng không được quá 999,999,999 VNĐ')
    .optional(),

  trang_thai: RoomStatusEnum.optional(),

  ngay_chot_so: z.number()
    .int('Ngày chốt số phải là số nguyên')
    .min(1, 'Ngày chốt số phải từ 1 đến 31')
    .max(31, 'Ngày chốt số phải từ 1 đến 31')
    .optional()
    .nullable(),

  max_dong_ho_dien: z.number()
    .int('Giá trị max đồng hồ điện phải là số nguyên')
    .positive('Giá trị max đồng hồ điện phải lớn hơn 0')
    .min(9999, 'Giá trị max đồng hồ điện tối thiểu là 9999 (4 chữ số)')
    .max(9999999, 'Giá trị max đồng hồ điện tối đa là 9999999 (7 chữ số)')
    .optional()
    .nullable(),

  max_dong_ho_nuoc: z.number()
    .int('Giá trị max đồng hồ nước phải là số nguyên')
    .positive('Giá trị max đồng hồ nước phải lớn hơn 0')
    .min(9999, 'Giá trị max đồng hồ nước tối thiểu là 9999 (4 chữ số)')
    .max(9999999, 'Giá trị max đồng hồ nước tối đa là 9999999 (7 chữ số)')
    .optional()
    .nullable(),
});

// Schema cho query filters
export const roomFiltersSchema = z.object({
  trang_thai: RoomStatusEnum.optional(),
  search: z.string().optional(),
});

// Type exports cho TypeScript-like documentation
/**
 * @typedef {z.infer<typeof createRoomSchema>} CreateRoomInput
 * @typedef {z.infer<typeof updateRoomSchema>} UpdateRoomInput
 * @typedef {z.infer<typeof roomFiltersSchema>} RoomFilters
 */
