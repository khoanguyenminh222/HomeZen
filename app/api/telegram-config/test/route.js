import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TelegramConfigurationService } from '@/lib/services/telegram-configuration.service.js';
import { telegramConfigSchema } from '@/lib/validations/notification-config.js';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * POST /api/telegram-config/test
 * Test Telegram bot connection (Property Owner only)
 * Requirements: 2.1, 2.3, 2.4, 6.1, 6.5, 7.1, 7.2
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ property owner mới có thể test telegram config
    if (session.user.role !== 'PROPERTY_OWNER') {
      logAuthorizationViolation(
        request,
        session,
        'Property Owner access required for telegram configuration test'
      );
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedConfig = telegramConfigSchema.parse(body);

    // Lấy bot token từ global config
    const { TelegramBotConfigService } = await import('@/lib/services/telegram-bot-config.service.js');
    const botToken = await TelegramBotConfigService.getDecryptedToken();
    
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token chưa được cấu hình. Vui lòng liên hệ quản trị viên.' },
        { status: 400 }
      );
    }

    const isValid = await TelegramConfigurationService.testConnection({
      botToken,
      chatId: validatedConfig.chatId,
    });

    if (isValid) {
      return NextResponse.json(
        { success: true, message: 'Kết nối Telegram bot thành công' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Kết nối Telegram bot thất bại' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test telegram config error:', error);
    
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
      { error: error.message || 'Đã xảy ra lỗi khi test kết nối Telegram bot' },
      { status: 400 }
    );
  }
}
