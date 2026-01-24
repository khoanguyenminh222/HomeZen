import prisma from '@/lib/prisma';
import { encryptionService } from './encryption.service.js';
import { telegramConfigSchema } from '@/lib/validations/notification-config.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';

/**
 * Telegram Configuration Service
 * Quản lý cấu hình telegram chatId (Property Owner)
 * Bot token được lấy từ global config (admin cấu hình)
 * Requirements: 2.2, 2.4, 6.2
 */
export class TelegramConfigurationService {
  /**
   * Tạo hoặc cập nhật cấu hình telegram cho user
   * @param {string} userId - User ID (property owner)
   * @param {Object} config - Telegram configuration data (chỉ chatId)
   * @returns {Promise<Object>} Created/Updated telegram configuration
   */
  static async upsert(userId, config) {
    // Validate input (chỉ chatId)
    const validatedConfig = telegramConfigSchema.parse(config);

    // Lấy bot token từ global config
    const botToken = await TelegramBotConfigService.getDecryptedToken();
    if (!botToken) {
      throw new Error('Bot token chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
    }

    // Test connection với bot token global và chatId của user
    await this.testConnection({ botToken, chatId: validatedConfig.chatId });

    // Encrypt chatId
    const encryptedChatId = await encryptionService.encrypt(validatedConfig.chatId);

    // Upsert configuration
    const telegramConfig = await prisma.telegramConfiguration.upsert({
      where: { userId },
      update: {
        chatId: encryptedChatId,
        isActive: true,
      },
      create: {
        userId,
        chatId: encryptedChatId,
        isActive: true,
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
    const config = await prisma.telegramConfiguration.findUnique({
      where: { userId },
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
    const config = await prisma.telegramConfiguration.findUnique({
      where: { userId },
    });

    if (!config) {
      return null;
    }

    // Lấy bot token từ global config
    const botToken = await TelegramBotConfigService.getDecryptedToken();

    return {
      id: config.id,
      userId: config.userId,
      botToken, // Lấy từ global config
      chatId: await encryptionService.decrypt(config.chatId),
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Xóa cấu hình telegram
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async delete(userId) {
    const config = await prisma.telegramConfiguration.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new Error('Cấu hình telegram không tồn tại');
    }

    await prisma.telegramConfiguration.delete({
      where: { userId },
    });
  }

  /**
   * Test Telegram bot connection
   * @param {Object} config - Telegram configuration to test (có botToken và chatId)
   * @returns {Promise<boolean>} True nếu connection thành công
   */
  static async testConnection(config) {
    try {
      // Validate chatId
      const validatedConfig = telegramConfigSchema.parse({ chatId: config.chatId });
      const botToken = config.botToken;

      if (!botToken) {
        throw new Error('Bot token chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      }

      // Test bot token bằng cách gọi getMe API
      const getMeResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
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
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: validatedConfig.chatId,
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
    // Decrypt chatId để mask
    let maskedChatId = '***';
    try {
      const chatId = config.chatId;
      if (chatId && chatId.length > 6) {
        // Nếu đã encrypted, cần decrypt trước (nhưng ở đây chỉ format response nên không decrypt)
        // Chỉ mask encrypted string
        maskedChatId = `${chatId.substring(0, 10)}***${chatId.substring(chatId.length - 10)}`;
      }
    } catch (e) {
      // Ignore
    }

    return {
      id: config.id,
      userId: config.userId,
      chatId: maskedChatId, // Masked chatId
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      // Note: botToken không được trả về (lấy từ global config)
    };
  }
}
