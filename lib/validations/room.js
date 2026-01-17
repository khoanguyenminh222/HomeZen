import { z } from 'zod';

/**
 * Zod validation schema cho Room
 * Requirements: 2.1-2.11, 11.2, 11.3
 */

// Enum cho trạng thái phòng
export const RoomStatusEnum = z.enum(['EMPTY', 'OCCUPIED']);

// Schema cho tạo phòng mới
export const createRoomSchema = z.object({
  code: z.string()
    .min(1, 'Mã phòng không được để trống')
    .max(20, 'Mã phòng không được quá 20 ký tự')
    .regex(/^[A-Za-z0-9]+$/, 'Mã phòng chỉ được chứa chữ cái và số'),
  
  name: z.string()
    .min(1, 'Tên phòng không được để trống')
    .max(100, 'Tên phòng không được quá 100 ký tự'),
  
  price: z.number()
    .positive('Giá phòng phải là số dương')
    .int('Giá phòng phải là số nguyên')
    .min(0, 'Giá phòng không được âm')
    .max(999999999, 'Giá phòng không được quá 999,999,999 VNĐ'),
  
  status: RoomStatusEnum.optional().default('EMPTY'),
  
  meterReadingDay: z.number()
    .int('Ngày chốt số phải là số nguyên')
    .min(1, 'Ngày chốt số phải từ 1 đến 31')
    .max(31, 'Ngày chốt số phải từ 1 đến 31')
    .optional()
    .nullable(),
});

// Schema cho cập nhật phòng
export const updateRoomSchema = z.object({
  code: z.string()
    .min(1, 'Mã phòng không được để trống')
    .max(20, 'Mã phòng không được quá 20 ký tự')
    .regex(/^[A-Za-z0-9]+$/, 'Mã phòng chỉ được chứa chữ cái và số')
    .optional(),
  
  name: z.string()
    .min(1, 'Tên phòng không được để trống')
    .max(100, 'Tên phòng không được quá 100 ký tự')
    .optional(),
  
  price: z.number()
    .positive('Giá phòng phải là số dương')
    .int('Giá phòng phải là số nguyên')
    .min(0, 'Giá phòng không được âm')
    .max(999999999, 'Giá phòng không được quá 999,999,999 VNĐ')
    .optional(),
  
  status: RoomStatusEnum.optional(),
  
  meterReadingDay: z.number()
    .int('Ngày chốt số phải là số nguyên')
    .min(1, 'Ngày chốt số phải từ 1 đến 31')
    .max(31, 'Ngày chốt số phải từ 1 đến 31')
    .optional()
    .nullable(),
});

// Schema cho query filters
export const roomFiltersSchema = z.object({
  status: RoomStatusEnum.optional(),
  search: z.string().optional(),
});

// Type exports cho TypeScript-like documentation
/**
 * @typedef {z.infer<typeof createRoomSchema>} CreateRoomInput
 * @typedef {z.infer<typeof updateRoomSchema>} UpdateRoomInput
 * @typedef {z.infer<typeof roomFiltersSchema>} RoomFilters
 */
