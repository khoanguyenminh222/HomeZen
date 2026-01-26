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
  logoUrl: urlOrPathSchema.optional().or(z.literal('')),
  faviconUrl: urlOrPathSchema.optional().or(z.literal('')),
  heroImageUrl: urlOrPathSchema.optional().or(z.literal('')),
  errorImageUrl: urlOrPathSchema.optional().or(z.literal('')),
  websiteTitle: z.string()
    .min(1, 'Tiêu đề website không được để trống')
    .max(100, 'Tiêu đề website không được vượt quá 100 ký tự'),
  websiteDescription: z.string()
    .min(1, 'Mô tả website không được để trống')
    .max(500, 'Mô tả website không được vượt quá 500 ký tự'),
  brandName: z.string()
    .min(1, 'Tên thương hiệu không được để trống')
    .max(50, 'Tên thương hiệu không được vượt quá 50 ký tự')
    .regex(/^[a-zA-Z0-9\s\-_ÀÁẢÃẠẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴĐàáảãạầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵđ]+$/, 'Tên thương hiệu chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang và gạch dưới'),
  heroTitle: z.string()
    .min(1, 'Tiêu đề hero không được để trống')
    .max(200, 'Tiêu đề hero không được vượt quá 200 ký tự'),
  heroSubtitle: z.string()
    .min(1, 'Phụ đề hero không được để trống')
    .max(200, 'Phụ đề hero không được vượt quá 200 ký tự'),
  footerText: z.string()
    .min(1, 'Văn bản footer không được để trống')
    .max(200, 'Văn bản footer không được vượt quá 200 ký tự'),
  stat1Value: z.string()
    .min(1, 'Giá trị thống kê 1 không được để trống')
    .max(50, 'Giá trị thống kê 1 không được vượt quá 50 ký tự'),
  stat1Label: z.string()
    .min(1, 'Nhãn thống kê 1 không được để trống')
    .max(50, 'Nhãn thống kê 1 không được vượt quá 50 ký tự'),
  stat2Value: z.string()
    .min(1, 'Giá trị thống kê 2 không được để trống')
    .max(50, 'Giá trị thống kê 2 không được vượt quá 50 ký tự'),
  stat2Label: z.string()
    .min(1, 'Nhãn thống kê 2 không được để trống')
    .max(50, 'Nhãn thống kê 2 không được vượt quá 50 ký tự'),
  contactEmail: z.string()
    .email('Email liên hệ phải là email hợp lệ')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string()
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
  logoUrl: '/images/home-zen-logo.png',
  faviconUrl: '/images/favicon.ico',
  heroImageUrl: '/images/home-zen-master-removebg-preview.png',
  errorImageUrl: '/images/home-zen-error.png',
  websiteTitle: 'HomeZen - Ứng dụng quản lý nhà trọ',
  websiteDescription: 'Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại',
  brandName: 'HomeZen',
  heroTitle: 'Chào Mừng Đến Với HomeZen',
  heroSubtitle: 'Quản lý nhà trọ thảnh thơi',
  footerText: 'HomeZen — Boarding House Management v1.0',
  stat1Value: '1k+',
  stat1Label: 'Tin cậy',
  stat2Value: '99%',
  stat2Label: 'Hài lòng',
  contactEmail: '',
  contactPhone: ''
};
