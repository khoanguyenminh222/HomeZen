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
        loai: 'EMAIL',
        nguoi_nhan: to,
        tieu_de: subject,
        noi_dung: content,
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

    // Tạo transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.su_dung_ssl,
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_password,
      },
      tls: {
        rejectUnauthorized: emailConfig.su_dung_tls,
      },
    });

    // Tự động lấy fromEmail từ smtpUser nếu không có
    const fromEmail = emailConfig.smtp_user;

    // Retry logic
    while (retryCount <= maxRetries) {
      try {
        const mailOptions = {
          from: emailConfig.ten_nguoi_gui
            ? `${emailConfig.ten_nguoi_gui} <${fromEmail}>`
            : fromEmail,
          to,
          subject,
          text: content,
          html: htmlContent || content,
        };

        const info = await transporter.sendMail(mailOptions);

        // Log thành công
        await createNotificationLog({
          loai: 'EMAIL',
          nguoi_nhan: to,
          tieu_de: subject,
          noi_dung: content,
          trang_thai: 'DA_GUI',
          so_lan_thu_lai: retryCount,
          thoi_gian_gui: new Date(),
          nguoi_dung_id: userId,
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
          loai: 'EMAIL',
          nguoi_nhan: to,
          tieu_de: subject,
          noi_dung: content,
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
      error: lastError?.message || 'Gửi email thất bại',
      retryCount: retryCount - 1,
    };
  }
}
