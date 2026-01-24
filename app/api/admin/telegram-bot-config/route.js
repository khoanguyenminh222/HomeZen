import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TelegramBotConfigService } from '@/lib/services/telegram-bot-config.service.js';
import { telegramBotTokenSchema } from '@/lib/validations/notification-config.js';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * GET /api/admin/telegram-bot-config
 * Lấy cấu hình bot token global (Super Admin only)
 */
export async function GET(request) {
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
        'Super Admin access required for telegram bot config'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const decrypted = searchParams.get('decrypted') === 'true';

    let config;
    if (decrypted) {
      // Lấy config đã decrypt để hiển thị bot token
      config = await TelegramBotConfigService.getDecrypted();
    } else {
      config = await TelegramBotConfigService.get();
    }

    return NextResponse.json(
      { data: config },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get telegram bot config error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy cấu hình bot token' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/telegram-bot-config
 * Tạo hoặc cập nhật bot token global (Super Admin only)
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
        'Super Admin access required for telegram bot config'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = telegramBotTokenSchema.parse(body);

    const config = await TelegramBotConfigService.upsert(
      validatedData,
      session.user.id
    );

    return NextResponse.json(
      { data: config, message: 'Bot token đã được lưu thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create/Update telegram bot config error:', error);
    
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
      { error: error.message || 'Đã xảy ra lỗi khi lưu bot token' },
      { status: 400 }
    );
  }
}
