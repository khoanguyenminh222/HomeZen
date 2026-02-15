import { z } from 'zod';

// Schema cho gán phí cho phòng
export const createRoomFeeSchema = z.object({
  loai_phi_id: z.string().cuid({ message: 'ID loại phí không hợp lệ' }),
  so_tien: z.number().min(0, 'Số tiền phải >= 0'),
  trang_thai: z.boolean().default(true),
});

// Schema cho cập nhật phí của phòng
export const updateRoomFeeSchema = z.object({
  so_tien: z.number().min(0, 'Số tiền phải >= 0').optional(),
  trang_thai: z.boolean().optional(),
});
