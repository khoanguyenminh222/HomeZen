import { EmailConfigurationService } from './email-configuration.service.js';
import { createNotificationLog } from './notification-log.service.js';
import nodemailer from 'nodemailer';

/**
 * Email Notification Service
 * Gửi email thông báo sử dụng SMTP configuration
 * Requirements: 4.1, 4.3, 4.4
 */
export class EmailNotificationService {
  /**
   * Gửi email
   * @param {string} to - Email người nhận
   * @param {string} subject - Tiêu đề email
   * @param {string} content - Nội dung email (text)
   * @param {string} htmlContent - Nội dung email (HTML, optional)
   * @param {string} userId - User ID (optional, để log)
   * @returns {Promise<Object>} Notification result
   */
  static async sendEmail(to, subject, content, htmlContent = null, userId = null) {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    // Lấy cấu hình email (decrypted)
    const emailConfig = await EmailConfigurationService.getDecrypted();

    if (!emailConfig) {
      const errorMsg = 'Cấu hình email chưa được thiết lập';
      await createNotificationLog({
        type: 'EMAIL',
        recipient: to,
        subject,
        message: content,
        status: 'FAILED',
        errorMessage: errorMsg,
        retryCount: 0,
        userId,
      });

      return {
        success: false,
        error: errorMsg,
        retryCount: 0,
      };
    }

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.useSSL,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword,
      },
      tls: {
        rejectUnauthorized: emailConfig.useTLS,
      },
    });

    // Tự động lấy fromEmail từ smtpUser nếu không có
    const fromEmail = emailConfig.fromEmail || emailConfig.smtpUser;

    // Retry logic
    while (retryCount <= maxRetries) {
      try {
        const mailOptions = {
          from: emailConfig.fromName
            ? `${emailConfig.fromName} <${fromEmail}>`
            : fromEmail,
          to,
          subject,
          text: content,
          html: htmlContent || content,
        };

        const info = await transporter.sendMail(mailOptions);

        // Log thành công
        await createNotificationLog({
          type: 'EMAIL',
          recipient: to,
          subject,
          message: content,
          status: 'SENT',
          retryCount,
          sentAt: new Date(),
          userId,
        });

        return {
          success: true,
          messageId: info.messageId,
          retryCount,
        };
      } catch (error) {
        lastError = error;
        retryCount++;

        // Log lỗi
        await createNotificationLog({
          type: 'EMAIL',
          recipient: to,
          subject,
          message: content,
          status: retryCount <= maxRetries ? 'RETRY' : 'FAILED',
          errorMessage: error.message,
          retryCount,
          userId,
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
      error: lastError?.message || 'Gửi email thất bại',
      retryCount: retryCount - 1,
    };
  }
}
