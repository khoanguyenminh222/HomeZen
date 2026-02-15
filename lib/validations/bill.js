import { z } from 'zod';

// Schema cho tạo hóa đơn mới
export const createBillSchema = z.object({
  phong_id: z.string().cuid({ message: 'ID phòng không hợp lệ' }),
  thang: z.number().int().min(1, 'Tháng phải từ 1-12').max(12, 'Tháng phải từ 1-12'),
  nam: z.number().int().min(2000, 'Năm không hợp lệ').max(2100, 'Năm không hợp lệ'),
  chi_so_dien_cu: z.number().int().min(0, 'Chỉ số điện cũ không được âm'),
  chi_so_dien_moi: z.number().int().min(0, 'Chỉ số điện mới không được âm'),
  chi_so_nuoc_cu: z.number().int().min(0, 'Chỉ số nước cũ không được âm'),
  chi_so_nuoc_moi: z.number().int().min(0, 'Chỉ số nước mới không được âm'),
  anh_dong_ho_dien: z.string().url({ message: 'URL ảnh đồng hồ điện không hợp lệ' }).optional().nullable(),
  anh_dong_ho_nuoc: z.string().url({ message: 'URL ảnh đồng hồ nước không hợp lệ' }).optional().nullable(),
  ghi_chu: z.string().max(1000, 'Ghi chú quá dài').optional().nullable(),
}).refine((data) => {
  // Chỉ số mới phải >= chỉ số cũ (trừ khi xoay vòng, nhưng validation này sẽ xử lý ở logic)
  return true; // Logic xoay vòng sẽ xử lý trong calculate functions
}, {
  message: 'Chỉ số đồng hồ không hợp lệ',
});

// Schema cho cập nhật hóa đơn
export const updateBillSchema = z.object({
  id: z.string().cuid({ message: 'ID hóa đơn không hợp lệ' }),
  phong_id: z.string().cuid({ message: 'ID phòng không hợp lệ' }).optional(),
  thang: z.number().int().min(1, 'Tháng phải từ 1-12').max(12, 'Tháng phải từ 1-12').optional(),
  nam: z.number().int().min(2000, 'Năm không hợp lệ').max(2100, 'Năm không hợp lệ').optional(),
  chi_so_dien_cu: z.number().int().min(0, 'Chỉ số điện cũ không được âm').optional(),
  chi_so_dien_moi: z.number().int().min(0, 'Chỉ số điện mới không được âm').optional(),
  chi_so_nuoc_cu: z.number().int().min(0, 'Chỉ số nước cũ không được âm').optional(),
  chi_so_nuoc_moi: z.number().int().min(0, 'Chỉ số nước mới không được âm').optional(),
  anh_dong_ho_dien: z.string().url({ message: 'URL ảnh đồng hồ điện không hợp lệ' }).optional().nullable(),
  anh_dong_ho_nuoc: z.string().url({ message: 'URL ảnh đồng hồ nước không hợp lệ' }).optional().nullable(),
  ghi_chu: z.string().max(1000, 'Ghi chú quá dài').optional().nullable(),
});

// Schema cho thêm phí phát sinh vào hóa đơn
export const addBillFeeSchema = z.object({
  ten_phi: z.string().min(1, 'Tên phí không được để trống').max(100, 'Tên phí quá dài'),
  so_tien: z.number().min(0, 'Số tiền phải >= 0'),
  loai_phi_id: z.string().cuid({ message: 'ID loại phí không hợp lệ' }).optional().nullable(),
});

// Schema cho cập nhật phí phát sinh
export const updateBillFeeSchema = z.object({
  ten_phi: z.string().min(1, 'Tên phí không được để trống').max(100, 'Tên phí quá dài').optional(),
  so_tien: z.number().min(0, 'Số tiền phải >= 0').optional(),
});

// Schema cho cập nhật trạng thái thanh toán
export const updateBillStatusSchema = z.object({
  da_thanh_toan: z.boolean(),
  so_tien_da_tra: z.number().min(0, 'Số tiền đã thanh toán phải >= 0').optional().nullable(),
  ngay_thanh_toan: z.string().datetime().optional().nullable(),
}).refine((data) => {
  // Nếu isPaid = true và có paidAmount, thì paidAmount không được vượt quá totalCost
  // (validation này sẽ được kiểm tra ở API route với totalCost thực tế)
  return true;
}, {
  message: 'Số tiền đã thanh toán không hợp lệ',
});
