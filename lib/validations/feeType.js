import { z } from 'zod';

// Schema cho tạo loại phí
export const createFeeTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại phí không được để trống').max(100, 'Tên loại phí quá dài'),
  description: z.string().max(500, 'Mô tả quá dài').optional().nullable(),
  isActive: z.boolean().default(true),
});

// Schema cho cập nhật loại phí
export const updateFeeTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại phí không được để trống').max(100, 'Tên loại phí quá dài').optional(),
  description: z.string().max(500, 'Mô tả quá dài').optional().nullable(),
  isActive: z.boolean().optional(),
});
