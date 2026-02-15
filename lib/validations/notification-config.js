import * as z from 'zod';

/**
 * Validation schemas cho notification configuration
 * Requirements: 1.2, 2.2, 5.3, 5.4
 */

// Email Configuration Validation
export const emailConfigSchema = z.object({
  smtp_host: z
    .string()
    .min(1, 'SMTP host không được để trống')
    .max(255, 'SMTP host quá dài')
    .refine(
      (val) => /^[a-zA-Z0-9.-]+$/.test(val.trim()),
      'SMTP host không hợp lệ (chỉ chứa chữ, số, dấu chấm và dấu gạch ngang)'
    ),

  smtp_port: z
    .number()
    .int('Port phải là số nguyên')
    .min(1, 'Port phải lớn hơn 0')
    .max(65535, 'Port không được vượt quá 65535'),

  smtp_user: z
    .string()
    .min(1, 'SMTP user không được để trống')
    .max(255, 'SMTP user quá dài'),

  smtp_password: z
    .string()
    .min(1, 'SMTP password không được để trống')
    .max(500, 'SMTP password quá dài'),

  fromEmail: z // Note: This is a frontend field, DB map to smtp_user
    .string()
    .max(255, 'Email người gửi quá dài')
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(val.trim());
      },
      'Email người gửi không đúng định dạng'
    )
    .optional(),

  ten_nguoi_gui: z
    .string()
    .max(255, 'Tên người gửi quá dài')
    .optional(),

  su_dung_tls: z
    .boolean()
    .default(true),

  su_dung_ssl: z
    .boolean()
    .default(false),
});

export const createEmailConfigSchema = emailConfigSchema;

export const updateEmailConfigSchema = emailConfigSchema.partial();

// Telegram Bot Token Config (Admin only)
export const telegramBotTokenSchema = z.object({
  bot_token: z
    .string()
    .min(1, 'Bot token không được để trống')
    .regex(/^\d+:[A-Za-z0-9_-]+$/, 'Bot token không đúng định dạng')
    .max(200, 'Bot token quá dài'),
  ten_bot: z
    .string()
    .max(100, 'Bot username quá dài')
    .regex(/^@?[A-Za-z0-9_]+$/, 'Bot username không hợp lệ')
    .optional(),
});

// Telegram Configuration Validation (Property Owner - chỉ chatId)
export const telegramConfigSchema = z.object({
  chat_id: z
    .string()
    .min(1, 'Chat ID không được để trống')
    .regex(/^-?\d+$/, 'Chat ID phải là số (có thể có dấu - ở đầu)')
    .max(50, 'Chat ID quá dài'),
});

export const createTelegramConfigSchema = telegramConfigSchema;

export const updateTelegramConfigSchema = telegramConfigSchema.partial();

// Notification Request Validation
export const sendEmailRequestSchema = z.object({
  to: z
    .email('Email người nhận không hợp lệ')
    .max(255, 'Email người nhận quá dài'),

  subject: z
    .string()
    .min(1, 'Tiêu đề không được để trống')
    .max(255, 'Tiêu đề quá dài'),

  content: z
    .string()
    .min(1, 'Nội dung không được để trống'),

  htmlContent: z
    .string()
    .optional(),
});

export const sendTelegramRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Tin nhắn không được để trống')
    .max(4096, 'Tin nhắn quá dài (tối đa 4096 ký tự)'),
});

// Room Closure Notification Validation
export const roomClosureNotificationSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID không được để trống'),

  daysBefore: z
    .number()
    .int('Số ngày phải là số nguyên')
    .min(0, 'Số ngày không được âm')
    .max(30, 'Số ngày không được vượt quá 30')
    .default(1),
});
