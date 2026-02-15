import prisma from '@/lib/prisma';
import { encryptionService } from './encryption.service.js';
import { telegramConfigSchema } from '@/lib/validations/notification-config.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';

/**
 * Telegram Configuration Service
 * Quản lý cấu hình telegram chat_id (Property Owner)
 * Bot token được lấy từ global config (admin cấu hình)
 * Requirements: 2.2, 2.4, 6.2
 */
export class TelegramConfigurationService {
  /**
   * Tạo hoặc cập nhật cấu hình telegram cho user
   * @param {string} userId - User ID (property owner)
   * @param {Object} config - Telegram configuration data (chỉ chat_id)
   * @returns {Promise<Object>} Created/Updated telegram configuration
   */
  static async upsert(userId, config) {
    // Validate input (chỉ chat_id)
    const validatedConfig = telegramConfigSchema.parse(config);

    // Lấy bot token từ global config
    const bot_token = await TelegramBotConfigService.getDecryptedToken();
    if (!bot_token) {
      throw new Error('Bot token chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
    }

    // Test connection với bot token global và chat_id của user
    await this.testConnection({ bot_token, chat_id: validatedConfig.chat_id });

    // Encrypt chat_id
    const encryptedChatId = await encryptionService.encrypt(validatedConfig.chat_id);

    // Upsert configuration
    const telegramConfig = await prisma.cFG_TELEGRAM_NGUOI_DUNG.upsert({
      where: { nguoi_dung_id: userId },
      update: {
        chat_id: encryptedChatId,
        trang_thai: true,
      },
      create: {
        nguoi_dung_id: userId,
        chat_id: encryptedChatId,
        trang_thai: true,
      },
    });

    return this.formatResponse(telegramConfig);
  }

  /**
   * Lấy cấu hình telegram của user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Telegram configuration hoặc null
   */
  static async getByUser(userId) {
    const config = await prisma.cFG_TELEGRAM_NGUOI_DUNG.findUnique({
      where: { nguoi_dung_id: userId },
    });

    if (!config) {
      return null;
    }

    return this.formatResponse(config);
  }

  /**
   * Lấy cấu hình telegram với decrypted data (chỉ dùng nội bộ)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Telegram configuration với decrypted data
   */
  static async getDecryptedByUser(userId) {
    const config = await prisma.cFG_TELEGRAM_NGUOI_DUNG.findUnique({
      where: { nguoi_dung_id: userId },
    });

    if (!config) {
      return null;
    }

    // Lấy bot token từ global config
    const bot_token = await TelegramBotConfigService.getDecryptedToken();

    return {
      id: config.id,
      nguoi_dung_id: config.nguoi_dung_id,
      bot_token, // Lấy từ global config
      chat_id: await encryptionService.decrypt(config.chat_id),
      trang_thai: config.trang_thai,
      ngay_tao: config.ngay_tao,
      ngay_cap_nhat: config.ngay_cap_nhat,
    };
  }

  /**
   * Xóa cấu hình telegram
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async delete(userId) {
    const config = await prisma.cFG_TELEGRAM_NGUOI_DUNG.findUnique({
      where: { nguoi_dung_id: userId },
    });

    if (!config) {
      throw new Error('Cấu hình telegram không tồn tại');
    }

    await prisma.cFG_TELEGRAM_NGUOI_DUNG.delete({
      where: { nguoi_dung_id: userId },
    });
  }

  /**
   * Test Telegram bot connection
   * @param {Object} config - Telegram configuration to test (có bot_token và chat_id)
   * @returns {Promise<boolean>} True nếu connection thành công
   */
  static async testConnection(config) {
    try {
      // Validate chat_id
      const validatedConfig = telegramConfigSchema.parse({ chat_id: config.chat_id });
      const bot_token = config.bot_token;

      if (!bot_token) {
        throw new Error('Bot token chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      }

      // Test bot token bằng cách gọi getMe API
      const getMeResponse = await fetch(
        `https://api.telegram.org/bot${bot_token}/getMe`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000), // 10 seconds timeout
        }
      );

      if (!getMeResponse.ok) {
        const errorData = await getMeResponse.json().catch(() => ({}));
        throw new Error(
          errorData.description || `Telegram API error: ${getMeResponse.status}`
        );
      }

      const getMeData = await getMeResponse.json();
      if (!getMeData.ok || !getMeData.result) {
        throw new Error('Bot token không hợp lệ hoặc bot không tồn tại');
      }

      // Test chat ID bằng cách gửi test message
      const testMessageResponse = await fetch(
        `https://api.telegram.org/bot${bot_token}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: validatedConfig.chat_id,
            text: '✅ Test kết nối thành công! Bot đã sẵn sàng nhận thông báo.',
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!testMessageResponse.ok) {
        const errorData = await testMessageResponse.json().catch(() => ({}));
        throw new Error(
          errorData.description || `Không thể gửi tin nhắn đến chat ID này: ${testMessageResponse.status}`
        );
      }

      return true;
    } catch (error) {
      console.error('Telegram connection test failed:', error);
      throw new Error(
        error.message === 'The operation was aborted'
          ? 'Kết nối Telegram timeout. Vui lòng kiểm tra lại cấu hình.'
          : `Không thể kết nối Telegram: ${error.message}`
      );
    }
  }

  /**
   * Format response (exclude sensitive data)
   * @param {Object} config - Telegram configuration từ database
   * @returns {Object} Formatted response
   */
  static formatResponse(config) {
    // Decrypt chat_id để mask
    let maskedChatId = '***';
    try {
      const chat_id = config.chat_id;
      if (chat_id && chat_id.length > 6) {
        maskedChatId = `${chat_id.substring(0, 10)}***${chat_id.substring(chat_id.length - 10)}`;
      }
    } catch (e) {
      // Ignore
    }

    return {
      id: config.id,
      nguoi_dung_id: config.nguoi_dung_id,
      chat_id: maskedChatId, // Masked chatId
      trang_thai: config.trang_thai,
      ngay_tao: config.ngay_tao,
      ngay_cap_nhat: config.ngay_cap_nhat,
      // Note: bot_token không được trả về (lấy từ global config)
    };
  }
}
