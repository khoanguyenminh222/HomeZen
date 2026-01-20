import { z } from 'zod';

// Schema cho gán phí cho phòng
export const createRoomFeeSchema = z.object({
  feeTypeId: z.cuid({ message: 'ID loại phí không hợp lệ' }),
  amount: z.number().min(0, 'Số tiền phải >= 0'),
  isActive: z.boolean().default(true),
});

// Schema cho cập nhật phí của phòng
export const updateRoomFeeSchema = z.object({
  amount: z.number().min(0, 'Số tiền phải >= 0').optional(),
  isActive: z.boolean().optional(),
});
