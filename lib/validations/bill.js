import { z } from 'zod';

// Schema cho tạo hóa đơn mới
export const createBillSchema = z.object({
  roomId: z.cuid({ message: 'ID phòng không hợp lệ' }),
  month: z.number().int().min(1, 'Tháng phải từ 1-12').max(12, 'Tháng phải từ 1-12'),
  year: z.number().int().min(2000, 'Năm không hợp lệ').max(2100, 'Năm không hợp lệ'),
  oldElectricReading: z.number().int().min(0, 'Chỉ số điện cũ không được âm'),
  newElectricReading: z.number().int().min(0, 'Chỉ số điện mới không được âm'),
  oldWaterReading: z.number().int().min(0, 'Chỉ số nước cũ không được âm'),
  newWaterReading: z.number().int().min(0, 'Chỉ số nước mới không được âm'),
  electricMeterPhotoUrl: z.url({ message: 'URL ảnh đồng hồ điện không hợp lệ' }).optional().nullable(),
  waterMeterPhotoUrl: z.url({ message: 'URL ảnh đồng hồ nước không hợp lệ' }).optional().nullable(),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional().nullable(),
}).refine((data) => {
  // Chỉ số mới phải >= chỉ số cũ (trừ khi xoay vòng, nhưng validation này sẽ xử lý ở logic)
  return true; // Logic xoay vòng sẽ xử lý trong calculate functions
}, {
  message: 'Chỉ số đồng hồ không hợp lệ',
});

// Schema cho cập nhật hóa đơn
export const updateBillSchema = z.object({
  id: z.cuid({ message: 'ID hóa đơn không hợp lệ' }),
  roomId: z.cuid({ message: 'ID phòng không hợp lệ' }).optional(),
  month: z.number().int().min(1, 'Tháng phải từ 1-12').max(12, 'Tháng phải từ 1-12').optional(),
  year: z.number().int().min(2000, 'Năm không hợp lệ').max(2100, 'Năm không hợp lệ').optional(),
  oldElectricReading: z.number().int().min(0, 'Chỉ số điện cũ không được âm').optional(),
  newElectricReading: z.number().int().min(0, 'Chỉ số điện mới không được âm').optional(),
  oldWaterReading: z.number().int().min(0, 'Chỉ số nước cũ không được âm').optional(),
  newWaterReading: z.number().int().min(0, 'Chỉ số nước mới không được âm').optional(),
  electricMeterPhotoUrl: z.url({ message: 'URL ảnh đồng hồ điện không hợp lệ' }).optional().nullable(),
  waterMeterPhotoUrl: z.url({ message: 'URL ảnh đồng hồ nước không hợp lệ' }).optional().nullable(),
  notes: z.string().max(1000, 'Ghi chú quá dài').optional().nullable(),
});

// Schema cho thêm phí phát sinh vào hóa đơn
export const addBillFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được để trống').max(100, 'Tên phí quá dài'),
  amount: z.number().min(0, 'Số tiền phải >= 0'),
  feeTypeId: z.cuid({ message: 'ID loại phí không hợp lệ' }).optional().nullable(),
});

// Schema cho cập nhật phí phát sinh
export const updateBillFeeSchema = z.object({
  name: z.string().min(1, 'Tên phí không được để trống').max(100, 'Tên phí quá dài').optional(),
  amount: z.number().min(0, 'Số tiền phải >= 0').optional(),
});

// Schema cho cập nhật trạng thái thanh toán
export const updateBillStatusSchema = z.object({
  isPaid: z.boolean(),
  paidDate: z.iso.datetime().optional().nullable(),
});
