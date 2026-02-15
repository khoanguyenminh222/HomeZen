import { z } from 'zod';

// Schema cho tạo loại phí
export const createFeeTypeSchema = z.object({
  ten_phi: z.string().min(1, 'Tên loại phí không được để trống').max(100, 'Tên loại phí quá dài'),
  mo_ta: z.string().max(500, 'Mô tả quá dài').optional().nullable(),
  trang_thai: z.boolean().default(true),
});

// Schema cho cập nhật loại phí
export const updateFeeTypeSchema = z.object({
  ten_phi: z.string().min(1, 'Tên loại phí không được để trống').max(100, 'Tên loại phí quá dài').optional(),
  mo_ta: z.string().max(500, 'Mô tả quá dài').optional().nullable(),
  trang_thai: z.boolean().optional(),
});
