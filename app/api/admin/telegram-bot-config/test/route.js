import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TelegramBotConfigService } from '@/lib/services/telegram-bot-config.service.js';
import { telegramBotTokenSchema } from '@/lib/validations/notification-config.js';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * POST /api/admin/telegram-bot-config/test
 * Test bot token (Super Admin only)
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      logAuthorizationViolation(
        request,
        session,
        'Super Admin access required for telegram bot config test'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedConfig = telegramBotTokenSchema.parse(body);

    const botInfo = await TelegramBotConfigService.testBotToken(validatedConfig.botToken);

    if (botInfo) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Bot token hợp lệ',
          botInfo: {
            username: botInfo.username,
            first_name: botInfo.first_name,
            id: botInfo.id,
          }
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Bot token không hợp lệ' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test telegram bot config error:', error);
    
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
      { error: error.message || 'Đã xảy ra lỗi khi test bot token' },
      { status: 400 }
    );
  }
}
