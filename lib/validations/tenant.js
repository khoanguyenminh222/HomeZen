import { z } from 'zod';

// Validation cho số điện thoại Việt Nam (10-11 chữ số)
const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8,9})$/;

// Validation cho CMND (9 chữ số) hoặc CCCD (12 chữ số)
const idCardRegex = /^(\d{9}|\d{12})$/;

// Schema cho tạo người thuê mới
export const createTenantSchema = z.object({
  fullName: z.string()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên không được quá 100 ký tự'),

  phone: z.string()
    .regex(phoneRegex, 'Số điện thoại không đúng định dạng (VD: 0901234567)'),

  idCard: z.string()
    .regex(idCardRegex, 'CMND/CCCD phải có 9 hoặc 12 chữ số')
    .optional()
    .or(z.literal(''))
    .nullable(),

  dateOfBirth: z.string()
    .optional()
    .nullable()
    .transform((val) => val ? new Date(val) : undefined),

  hometown: z.string()
    .max(200, 'Quê quán không được quá 200 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),

  moveInDate: z.string()
    .optional()
    .nullable()
    .transform((val) => val ? new Date(val) : undefined),

  deposit: z.union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(num) || num < 0 ? null : num;
    }),

  roomId: z.string()
    .optional()
    .nullable(),

  contractFileUrl: z.string()
    .url('URL file hợp đồng không hợp lệ')
    .optional()
    .or(z.literal(''))
    .nullable()
});

// Schema cho cập nhật người thuê
export const updateTenantSchema = createTenantSchema.partial();

// Schema cho tạo người ở
export const createOccupantSchema = z.object({
  fullName: z.string()
    .min(1, 'Họ tên không được để trống')
    .max(100, 'Họ tên không được quá 100 ký tự'),

  idCard: z.string()
    .regex(idCardRegex, 'CMND/CCCD phải có 9 hoặc 12 chữ số')
    .optional()
    .or(z.literal(''))
    .nullable(),

  dateOfBirth: z.string()
    .optional()
    .nullable()
    .transform((val) => val ? new Date(val) : undefined),

  hometown: z.string()
    .max(200, 'Quê quán không được quá 200 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),

  relationship: z.string()
    .max(100, 'Quan hệ không được quá 100 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),

  residenceType: z.enum(['TEMPORARY', 'PERMANENT'], {
    errorMap: () => ({ message: 'Loại cư trú phải là "Tạm trú" hoặc "Thường trú"' })
  }).default('TEMPORARY')
});

// Schema cho cập nhật người ở
export const updateOccupantSchema = createOccupantSchema.partial();

// Schema cho hoàn trả cọc
export const depositReturnSchema = z.object({
  amount: z.number()
    .min(0, 'Số tiền hoàn trả phải >= 0'),

  method: z.enum(['FULL_RETURN', 'DEDUCT_FROM_LAST_BILL'], {
    errorMap: () => ({ message: 'Phương thức hoàn trả không hợp lệ' })
  }),

  notes: z.string()
    .max(500, 'Ghi chú không được quá 500 ký tự')
    .optional()
    .or(z.literal(''))
});

// Schema cho chuyển người thuê chính
export const transferTenantSchema = z.object({
  newTenantId: z.string()
    .min(1, 'Phải chọn người thuê mới'),

  roomId: z.string()
    .min(1, 'Phải chọn phòng')
});
