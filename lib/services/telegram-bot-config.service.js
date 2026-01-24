import prisma from '@/lib/prisma';
import { encryptionService } from './encryption.service.js';
import { telegramBotTokenSchema } from '@/lib/validations/notification-config.js';

/**
 * Telegram Bot Config Service
 * Quản lý bot token global (Super Admin only)
 */
export class TelegramBotConfigService {
  /**
   * Tạo hoặc cập nhật bot token global
   * @param {Object} config - Bot token config
   * @param {string} createdBy - Super Admin user ID
   * @returns {Promise<Object>} Created/Updated bot config
   */
  static async upsert(config, createdBy) {
    // Validate input
    const validatedConfig = telegramBotTokenSchema.parse(config);

    // Test bot token và lấy bot info (bao gồm username)
    const botInfo = await this.testBotToken(validatedConfig.botToken);

    // Encrypt bot token
    const encryptedBotToken = await encryptionService.encrypt(validatedConfig.botToken);

    // Sử dụng botUsername từ config hoặc tự động lấy từ Telegram API
    const botUsername = validatedConfig.botUsername || botInfo?.username || null;
    // Đảm bảo botUsername có @ ở đầu
    const formattedBotUsername = botUsername ? (botUsername.startsWith('@') ? botUsername : `@${botUsername}`) : null;

    // Tìm config hiện tại
    const existing = await prisma.telegramBotConfig.findFirst({
      where: { isActive: true },
    });

    let botConfig;
    if (existing) {
      // Update existing
      botConfig = await prisma.telegramBotConfig.update({
        where: { id: existing.id },
        data: {
          botToken: encryptedBotToken,
          botUsername: formattedBotUsername,
          isActive: true,
        },
      });
    } else {
      // Create new
      botConfig = await prisma.telegramBotConfig.create({
        data: {
          botToken: encryptedBotToken,
          botUsername: formattedBotUsername,
          isActive: true,
          createdBy,
        },
      });
    }

    return this.formatResponse(botConfig);
  }

  /**
   * Lấy bot token config hiện tại
   * @returns {Promise<Object|null>} Bot config hoặc null
   */
  static async get() {
    const config = await prisma.telegramBotConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    return this.formatResponse(config);
  }

  /**
   * Lấy bot token decrypted (chỉ dùng nội bộ)
   * @returns {Promise<string|null>} Bot token hoặc null
   */
  static async getDecryptedToken() {
    const config = await prisma.telegramBotConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    return await encryptionService.decrypt(config.botToken);
  }

  /**
   * Lấy bot config với decrypted token (để hiển thị)
   * @returns {Promise<Object|null>} Bot config với decrypted token hoặc null
   */
  static async getDecrypted() {
    const config = await prisma.telegramBotConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    return {
      id: config.id,
      botToken: await encryptionService.decrypt(config.botToken),
      botUsername: config.botUsername,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Test bot token và lấy thông tin bot
   * @param {string} botToken - Bot token to test
   * @returns {Promise<Object>} Bot info (username, id, first_name, etc.)
   */
  static async testBotToken(botToken) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000), // 10 seconds timeout
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.description || `Telegram API error: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.ok || !data.result) {
        throw new Error('Bot token không hợp lệ hoặc bot không tồn tại');
      }

      // Trả về thông tin bot (bao gồm username)
      return data.result;
    } catch (error) {
      console.error('Telegram bot token test failed:', error);
      throw new Error(
        error.message === 'The operation was aborted'
          ? 'Kết nối Telegram timeout. Vui lòng kiểm tra lại bot token.'
          : `Không thể kết nối Telegram: ${error.message}`
      );
    }
  }

  /**
   * Format response (exclude sensitive data)
   * @param {Object} config - Bot config từ database
   * @returns {Object} Formatted response
   */
  static formatResponse(config) {
    return {
      id: config.id,
      botUsername: config.botUsername,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      // Note: botToken không được trả về trong response
    };
  }
}
