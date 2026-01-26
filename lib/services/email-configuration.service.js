import prisma from '@/lib/prisma';
import { encryptionService } from './encryption.service.js';
import { emailConfigSchema } from '@/lib/validations/notification-config.js';
import nodemailer from 'nodemailer';
import { getWebsiteConfigurationService } from './website-configuration.service';

/**
 * Email Configuration Service
 * Quản lý cấu hình email SMTP (Super Admin only)
 * Requirements: 1.2, 1.4, 5.2
 */
export class EmailConfigurationService {
  /**
   * Tạo cấu hình email mới
   * @param {Object} config - Email configuration data
   * @param {string} createdBy - Super Admin user ID
   * @returns {Promise<Object>} Created email configuration
   */
  static async create(config, createdBy) {
    // Validate input
    const validatedConfig = emailConfigSchema.parse(config);

    // Kiểm tra xem đã có cấu hình active chưa
    const existing = await prisma.emailConfiguration.findFirst({
      where: { isActive: true },
    });

    if (existing) {
      throw new Error('Đã tồn tại cấu hình email đang hoạt động. Vui lòng cập nhật hoặc xóa cấu hình hiện tại.');
    }

    // Test connection trước khi lưu
    await this.testConnection(validatedConfig);

    // Encrypt sensitive data
    const encryptedHost = await encryptionService.encrypt(validatedConfig.smtpHost);
    const encryptedUser = await encryptionService.encrypt(validatedConfig.smtpUser);
    const encryptedPassword = await encryptionService.encrypt(validatedConfig.smtpPassword);

    // Tạo cấu hình mới
    const emailConfig = await prisma.emailConfiguration.create({
      data: {
        smtpHost: encryptedHost,
        smtpPort: validatedConfig.smtpPort,
        smtpUser: encryptedUser,
        smtpPassword: encryptedPassword,
        fromName: validatedConfig.fromName,
        useTLS: validatedConfig.useTLS,
        useSSL: validatedConfig.useSSL,
        isActive: true,
        createdBy,
      },
    });

    return this.formatResponse(emailConfig);
  }

  /**
   * Cập nhật cấu hình email
   * @param {string} id - Configuration ID
   * @param {Object} config - Updated configuration data
   * @returns {Promise<Object>} Updated email configuration
   */
  static async update(id, config) {
    // Validate input
    const validatedConfig = emailConfigSchema.partial().parse(config);

    // Tìm cấu hình hiện tại
    const existing = await prisma.emailConfiguration.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Cấu hình email không tồn tại');
    }

    // Merge với dữ liệu hiện tại để test connection
    const testConfig = {
      smtpHost: config.smtpHost || await encryptionService.decrypt(existing.smtpHost),
      smtpPort: config.smtpPort || existing.smtpPort,
      smtpUser: config.smtpUser || await encryptionService.decrypt(existing.smtpUser),
      smtpPassword: config.smtpPassword || await encryptionService.decrypt(existing.smtpPassword),
      fromName: config.fromName || existing.fromName,
      useTLS: config.useTLS !== undefined ? config.useTLS : existing.useTLS,
      useSSL: config.useSSL !== undefined ? config.useSSL : existing.useSSL,
    };

    // Test connection với cấu hình mới
    await this.testConnection(testConfig);

    // Prepare update data
    const updateData = {};

    if (config.smtpHost) {
      updateData.smtpHost = await encryptionService.encrypt(config.smtpHost);
    }
    if (config.smtpPort !== undefined) {
      updateData.smtpPort = config.smtpPort;
    }
    if (config.smtpUser) {
      updateData.smtpUser = await encryptionService.encrypt(config.smtpUser);
    }
    if (config.smtpPassword) {
      updateData.smtpPassword = await encryptionService.encrypt(config.smtpPassword);
    }
    if (config.fromName !== undefined) {
      updateData.fromName = config.fromName;
    }
    if (config.useTLS !== undefined) {
      updateData.useTLS = config.useTLS;
    }
    if (config.useSSL !== undefined) {
      updateData.useSSL = config.useSSL;
    }

    // Cập nhật
    const updated = await prisma.emailConfiguration.update({
      where: { id },
      data: updateData,
    });

    return this.formatResponse(updated);
  }

  /**
   * Lấy cấu hình email hiện tại
   * @returns {Promise<Object|null>} Email configuration hoặc null
   */
  static async get() {
    const config = await prisma.emailConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    return this.formatResponse(config);
  }

  /**
   * Lấy cấu hình email với decrypted data (chỉ dùng nội bộ)
   * @returns {Promise<Object|null>} Email configuration với decrypted data
   */
  static async getDecrypted() {
    const config = await prisma.emailConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return null;
    }

    const smtpUser = await encryptionService.decrypt(config.smtpUser);
    return {
      id: config.id,
      smtpHost: await encryptionService.decrypt(config.smtpHost),
      smtpPort: config.smtpPort,
      smtpUser: smtpUser,
      smtpPassword: await encryptionService.decrypt(config.smtpPassword),
      fromEmail: smtpUser, // Tự động lấy từ smtpUser
      fromName: config.fromName,
      useTLS: config.useTLS,
      useSSL: config.useSSL,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Xóa cấu hình email
   * @param {string} id - Configuration ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const config = await prisma.emailConfiguration.findUnique({
      where: { id },
    });

    if (!config) {
      throw new Error('Cấu hình email không tồn tại');
    }

    await prisma.emailConfiguration.delete({
      where: { id },
    });
  }

  /**
   * Test SMTP connection
   * @param {Object} config - Email configuration to test
   * @returns {Promise<boolean>} True nếu connection thành công
   */
  static async testConnection(config) {
    try {
      // Validate config trước
      const validatedConfig = emailConfigSchema.parse(config);

      // Validate và normalize SMTP host
      let smtpHost = validatedConfig.smtpHost.trim();
      
      // Nếu user nhập "gmail" thì tự động thêm "smtp."
      if (smtpHost.toLowerCase() === 'gmail') {
        smtpHost = 'smtp.gmail.com';
      } else if (!smtpHost.includes('.')) {
        throw new Error('SMTP host không hợp lệ. Vui lòng nhập đầy đủ domain (VD: smtp.gmail.com)');
      }

      // Tạo transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: validatedConfig.smtpPort,
        secure: validatedConfig.useSSL, // true for 465, false for other ports
        auth: {
          user: validatedConfig.smtpUser,
          pass: validatedConfig.smtpPassword,
        },
        tls: {
          rejectUnauthorized: validatedConfig.useTLS,
        },
      });

      // Test connection với timeout 30 giây
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        ),
      ]);

      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      
      // Xử lý các loại lỗi phổ biến
      let errorMessage = error.message;
      
      // Lỗi timeout
      if (error.message === 'Connection timeout' || error.message.includes('timeout')) {
        errorMessage = 'Kết nối SMTP timeout. Vui lòng kiểm tra lại cấu hình host và port.';
      }
      // Lỗi authentication (Gmail thường gặp)
      else if (error.message.includes('Invalid login') || 
               error.message.includes('Username and Password not accepted') ||
               error.message.includes('535') ||
               error.message.includes('BadCredentials')) {
        errorMessage = 'Sai tên đăng nhập hoặc mật khẩu. Với Gmail, bạn cần:\n' +
          '1. Bật 2-Step Verification\n' +
          '2. Tạo App Password tại: https://myaccount.google.com/apppasswords\n' +
          '3. Sử dụng App Password thay vì mật khẩu thông thường';
      }
      // Lỗi connection
      else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorMessage = `Không thể tìm thấy SMTP server "${smtpHost}". Vui lòng kiểm tra lại host name.`;
      }
      // Lỗi SSL/TLS
      else if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        errorMessage = 'Lỗi SSL/TLS. Vui lòng kiểm tra lại cài đặt TLS/SSL và port.';
      }
      // Lỗi khác
      else {
        errorMessage = `Không thể kết nối SMTP: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Gửi email test
   * @param {Object} config - Email configuration để gửi email
   * @param {string} testEmail - Email nhận để test
   * @returns {Promise<boolean>} True nếu gửi email thành công
   */
  static async sendTestEmail(config, testEmail) {
    try {
      // Validate config trước
      const validatedConfig = emailConfigSchema.parse(config);

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        throw new Error('Email không hợp lệ');
      }

      // Validate và normalize SMTP host
      let smtpHost = validatedConfig.smtpHost.trim();
      
      // Nếu user nhập "gmail" thì tự động thêm "smtp."
      if (smtpHost.toLowerCase() === 'gmail') {
        smtpHost = 'smtp.gmail.com';
      } else if (!smtpHost.includes('.')) {
        throw new Error('SMTP host không hợp lệ. Vui lòng nhập đầy đủ domain (VD: smtp.gmail.com)');
      }

      // Tạo transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: validatedConfig.smtpPort,
        secure: validatedConfig.useSSL, // true for 465, false for other ports
        auth: {
          user: validatedConfig.smtpUser,
          pass: validatedConfig.smtpPassword,
        },
        tls: {
          rejectUnauthorized: validatedConfig.useTLS,
        },
      });

      // Tự động lấy fromEmail từ smtpUser nếu không có
      const fromEmail = validatedConfig.fromEmail || validatedConfig.smtpUser;
      
      // Lấy brand name từ website config
      const websiteConfigService = getWebsiteConfigurationService();
      const websiteConfig = await websiteConfigService.getCurrentConfiguration();
      const brandName = websiteConfig.brandName || 'HomeZen';
      
      // Gửi email test
      const fromName = validatedConfig.fromName || fromEmail;
      const mailOptions = {
        from: validatedConfig.fromName 
          ? `${validatedConfig.fromName} <${fromEmail}>`
          : fromEmail,
        to: testEmail,
        subject: `Email Test từ ${brandName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Test Thành Công!</h2>
            <p>Xin chào,</p>
            <p>Đây là email test từ hệ thống ${brandName}. Nếu bạn nhận được email này, có nghĩa là cấu hình SMTP của bạn đã hoạt động chính xác.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Thông tin cấu hình:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>SMTP Host: ${smtpHost}</li>
                <li>SMTP Port: ${validatedConfig.smtpPort}</li>
                <li>From Email: ${fromEmail}</li>
                <li>From Name: ${fromName}</li>
              </ul>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Email này được gửi tự động từ hệ thống ${brandName} để kiểm tra cấu hình email.
            </p>
          </div>
        `,
        text: `
Email Test Thành Công!

Xin chào,

Đây là email test từ hệ thống ${brandName}. Nếu bạn nhận được email này, có nghĩa là cấu hình SMTP của bạn đã hoạt động chính xác.

Thông tin cấu hình:
- SMTP Host: ${smtpHost}
- SMTP Port: ${validatedConfig.smtpPort}
- From Email: ${fromEmail}
- From Name: ${fromName}

Email này được gửi tự động từ hệ thống ${brandName} để kiểm tra cấu hình email.
        `,
      };

      // Gửi email với timeout 30 giây
      await Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Send email timeout')), 30000)
        ),
      ]);

      return true;
    } catch (error) {
      console.error('Send test email failed:', error);
      
      // Xử lý các loại lỗi phổ biến
      let errorMessage = error.message;
      
      // Lỗi timeout
      if (error.message === 'Send email timeout' || error.message.includes('timeout')) {
        errorMessage = 'Gửi email timeout. Vui lòng kiểm tra lại cấu hình host và port.';
      }
      // Lỗi authentication
      else if (error.message.includes('Invalid login') || 
               error.message.includes('Username and Password not accepted') ||
               error.message.includes('535') ||
               error.message.includes('BadCredentials')) {
        errorMessage = 'Sai tên đăng nhập hoặc mật khẩu. Với Gmail, bạn cần:\n' +
          '1. Bật 2-Step Verification\n' +
          '2. Tạo App Password tại: https://myaccount.google.com/apppasswords\n' +
          '3. Sử dụng App Password thay vì mật khẩu thông thường';
      }
      // Lỗi connection
      else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorMessage = `Không thể tìm thấy SMTP server. Vui lòng kiểm tra lại host name.`;
      }
      // Lỗi SSL/TLS
      else if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
        errorMessage = 'Lỗi SSL/TLS. Vui lòng kiểm tra lại cài đặt TLS/SSL và port.';
      }
      // Lỗi email không hợp lệ
      else if (error.message.includes('Email không hợp lệ')) {
        errorMessage = 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.';
      }
      // Lỗi khác
      else {
        errorMessage = `Không thể gửi email: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Format response (exclude sensitive data)
   * @param {Object} config - Email configuration từ database
   * @returns {Object} Formatted response
   */
  static formatResponse(config) {
    return {
      id: config.id,
      smtpHost: config.smtpHost, // Trả về encrypted, không decrypt
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser, // Trả về encrypted, không decrypt
      fromName: config.fromName,
      useTLS: config.useTLS,
      useSSL: config.useSSL,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      // Note: smtpPassword không được trả về trong response
      // Note: fromEmail không được lưu trong DB, tự động lấy từ smtpUser khi gửi email
    };
  }
}
