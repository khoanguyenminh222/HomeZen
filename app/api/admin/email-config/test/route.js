import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { EmailConfigurationService } from '@/lib/services/email-configuration.service.js';
import { emailConfigSchema } from '@/lib/validations/notification-config.js';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * POST /api/admin/email-config/test
 * Test SMTP connection (Super Admin only)
 * Requirements: 1.1, 1.3, 1.4, 5.5, 7.1, 7.2
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.vai_tro !== 'SIEU_QUAN_TRI') {
      logAuthorizationViolation(
        request,
        session,
        'Super Admin access required for email configuration test'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { testEmail, useSavedConfig, ...configData } = body;

    // Nếu có testEmail, gửi email test
    if (testEmail) {
      let validatedConfig;

      // Nếu useSavedConfig = true hoặc không có đủ thông tin trong configData, lấy từ DB
      const hasIncompleteConfig = !configData.smtp_host || !configData.smtp_user || !configData.smtp_password;

      if (useSavedConfig || hasIncompleteConfig) {
        // Lấy config đã lưu từ DB (decrypted)
        const savedConfig = await EmailConfigurationService.getDecrypted();

        if (!savedConfig) {
          return NextResponse.json(
            {
              success: false,
              error: 'Không tìm thấy cấu hình email đã lưu. Vui lòng lưu cấu hình trước.'
            },
            { status: 400 }
          );
        }

        validatedConfig = savedConfig;
      } else {
        // Sử dụng config từ form
        validatedConfig = emailConfigSchema.parse(configData);
      }

      try {
        await EmailConfigurationService.sendTestEmail(validatedConfig, testEmail);
        return NextResponse.json(
          {
            success: true,
            message: `Email test đã được gửi thành công đến ${testEmail}`
          },
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'Không thể gửi email test'
          },
          { status: 400 }
        );
      }
    }

    // Nếu không có testEmail, chỉ test connection
    // Nếu không có đủ thông tin, lấy từ DB
    const hasIncompleteConfig = !configData.smtp_host || !configData.smtp_user || !configData.smtp_password;

    let validatedConfig;
    if (hasIncompleteConfig) {
      const savedConfig = await EmailConfigurationService.getDecrypted();

      if (!savedConfig) {
        return NextResponse.json(
          {
            success: false,
            error: 'Không tìm thấy cấu hình email đã lưu. Vui lòng điền đầy đủ thông tin hoặc lưu cấu hình trước.'
          },
          { status: 400 }
        );
      }

      validatedConfig = savedConfig;
    } else {
      validatedConfig = emailConfigSchema.parse(configData);
    }

    const isValid = await EmailConfigurationService.testConnection(validatedConfig);

    if (isValid) {
      return NextResponse.json(
        { success: true, message: 'Kết nối SMTP thành công' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Kết nối SMTP thất bại' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test email config error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi khi test kết nối SMTP' },
      { status: 400 }
    );
  }
}
