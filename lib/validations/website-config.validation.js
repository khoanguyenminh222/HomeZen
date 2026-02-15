// lib/validations/website-config.validation.js
import { z } from 'zod';

/**
 * Validation schema for Website Configuration
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.7
 */
// Helper to validate URL or relative path
const urlOrPathSchema = z.string().refine(
  (val) => {
    if (!val || val === '') return true;
    // Allow relative paths (start with /)
    if (val.startsWith('/')) return true;
    // Allow full URLs (http/https)
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Phải là URL hợp lệ hoặc đường dẫn tương đối (bắt đầu với /)' }
);

export const websiteConfigSchema = z.object({
  logo_url: urlOrPathSchema.optional().or(z.literal('')),
  favicon_url: urlOrPathSchema.optional().or(z.literal('')),
  anh_hero_url: urlOrPathSchema.optional().or(z.literal('')),
  anh_loi_url: urlOrPathSchema.optional().or(z.literal('')),
  tieu_de_website: z.string()
    .min(1, 'Tiêu đề website không được để trống')
    .max(100, 'Tiêu đề website không được vượt quá 100 ký tự'),
  mo_ta_website: z.string()
    .min(1, 'Mô tả website không được để trống')
    .max(500, 'Mô tả website không được vượt quá 500 ký tự'),
  ten_thuong_hieu: z.string()
    .min(1, 'Tên thương hiệu không được để trống')
    .max(50, 'Tên thương hiệu không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9\s\-_ÀÁẢÃẠẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴĐàáảãạầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵđ]+$/, 'Tên thương hiệu chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang và gạch dưới'),
  tieu_de_hero: z.string()
    .min(1, 'Tiêu đề hero không được để trống')
    .max(200, 'Tiêu đề hero không được vượt quá 200 ký tự'),
  phu_de_hero: z.string()
    .min(1, 'Phụ đề hero không được để trống')
    .max(200, 'Phụ đề hero không được vượt quá 200 ký tự'),
  tieu_de_footer: z.string()
    .min(1, 'Văn bản footer không được để trống')
    .max(200, 'Văn bản footer không được vượt quá 200 ký tự'),
  gia_tri_thong_ke_1: z.string()
    .min(1, 'Giá trị thống kê 1 không được để trống')
    .max(50, 'Giá trị thống kê 1 không được vượt quá 50 ký tự'),
  ten_thong_ke_1: z.string()
    .min(1, 'Nhãn thống kê 1 không được để trống')
    .max(50, 'Nhãn thống kê 1 không được vượt quá 50 ký tự'),
  gia_tri_thong_ke_2: z.string()
    .min(1, 'Giá trị thống kê 2 không được để trống')
    .max(50, 'Giá trị thống kê 2 không được vượt quá 50 ký tự'),
  ten_thong_ke_2: z.string()
    .min(1, 'Nhãn thống kê 2 không được để trống')
    .max(50, 'Nhãn thống kê 2 không được vượt quá 50 ký tự'),
  email_lien_he: z.string()
    .email('Email liên hệ phải là email hợp lệ')
    .optional()
    .or(z.literal('')),
  sdt_lien_he: z.string()
    .regex(/^[0-9+\-\s()]*$/, 'Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc')
    .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
    .optional()
    .or(z.literal(''))
});

/**
 * Default configuration values
 * Requirements: 2.5
 */
export const defaultWebsiteConfig = {
  logo_url: '/images/home-zen-logo.png',
  favicon_url: '/images/favicon.ico',
  anh_hero_url: '/images/home-zen-master-removebg-preview.png',
  anh_loi_url: '/images/home-zen-error.png',
  tieu_de_website: 'HomeZen - Ứng dụng quản lý nhà trọ',
  mo_ta_website: 'Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại',
  ten_thuong_hieu: 'HomeZen',
  tieu_de_hero: 'Chào Mừng Đến Với HomeZen',
  phu_de_hero: 'Quản lý nhà trọ thảnh thơi',
  tieu_de_footer: 'HomeZen — Boarding House Management v1.0',
  gia_tri_thong_ke_1: '1k+',
  ten_thong_ke_1: 'Tin cậy',
  gia_tri_thong_ke_2: '99%',
  ten_thong_ke_2: 'Hài lòng',
  email_lien_he: '',
  sdt_lien_he: ''
};
