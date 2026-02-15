import { TelegramConfigurationService } from './telegram-configuration.service.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';
import { createNotificationLog } from './notification-log.service.js';

/**
 * Telegram Notification Service
 * Gửi thông báo telegram sử dụng bot configuration
 * Requirements: 3.1, 3.3, 3.5
 */
export class TelegramNotificationService {
  /**
   * Gửi tin nhắn telegram
   * @param {string} userId - User ID (property owner)
   * @param {string} message - Nội dung tin nhắn
   * @returns {Promise<Object>} Notification result
   */
  static async sendMessage(userId, message) {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    // Lấy cấu hình telegram (decrypted)
    const telegramConfig = await TelegramConfigurationService.getDecryptedByUser(userId);

    if (!telegramConfig || !telegramConfig.trang_thai) {
      const errorMsg = 'Cấu hình telegram chưa được thiết lập hoặc đã bị vô hiệu hóa';
      await createNotificationLog({
        loai: 'TELEGRAM',
        nguoi_nhan: userId,
        noi_dung: message,
        trang_thai: 'THAT_BAI',
        thong_bao_loi: errorMsg,
        so_lan_thu_lai: 0,
        nguoi_dung_id: userId,
      });

      return {
        success: false,
        error: errorMsg,
        retryCount: 0,
      };
    }

    // Retry logic
    while (retryCount <= maxRetries) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${telegramConfig.bot_token}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: telegramConfig.chat_id,
              text: message,
              parse_mode: 'HTML',
            }),
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

        if (!data.ok) {
          throw new Error('Gửi tin nhắn telegram thất bại');
        }

        // Log thành công
        await createNotificationLog({
          loai: 'TELEGRAM',
          nguoi_nhan: telegramConfig.chat_id,
          noi_dung: message,
          trang_thai: 'DA_GUI',
          so_lan_thu_lai: retryCount,
          thoi_gian_gui: new Date(),
          nguoi_dung_id: userId,
        });

        return {
          success: true,
          messageId: data.result?.message_id?.toString(),
          retryCount,
        };
      } catch (error) {
        lastError = error;
        retryCount++;

        // Log lỗi
        await createNotificationLog({
          loai: 'TELEGRAM',
          nguoi_nhan: telegramConfig.chat_id || userId,
          noi_dung: message,
          trang_thai: retryCount <= maxRetries ? 'THU_LAI' : 'THAT_BAI',
          thong_bao_loi: error.message,
          so_lan_thu_lai: retryCount,
          nguoi_dung_id: userId,
        });

        // Nếu đã hết số lần retry, trả về lỗi
        if (retryCount > maxRetries) {
          return {
            success: false,
            error: error.message,
            retryCount: retryCount - 1,
          };
        }

        // Exponential backoff: 1 phút, 5 phút, 15 phút
        const delayMs = [60000, 300000, 900000][retryCount - 1] || 900000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Gửi tin nhắn telegram thất bại',
      retryCount: retryCount - 1,
    };
  }
}
