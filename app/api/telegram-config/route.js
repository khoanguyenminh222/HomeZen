import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TelegramConfigurationService } from '@/lib/services/telegram-configuration.service.js';
import { TelegramBotConfigService } from '@/lib/services/telegram-bot-config.service.js';
import { createTelegramConfigSchema, updateTelegramConfigSchema } from '@/lib/validations/notification-config.js';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * GET /api/telegram-config
 * Lấy cấu hình telegram của user hiện tại (Property Owner only)
 * Requirements: 2.1, 2.3, 6.1, 6.5, 7.1, 7.2, 7.5
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ property owner mới có thể cấu hình telegram
    if (session.user.vai_tro !== 'CHU_NHA_TRO') {
      logAuthorizationViolation(
        request,
        session,
        'Property Owner access required for telegram configuration'
      );
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const decrypted = searchParams.get('decrypted') === 'true';

    let config;
    if (decrypted) {
      // Lấy config đã decrypt để hiển thị trong form
      config = await TelegramConfigurationService.getDecryptedByUser(session.user.id);
      if (config) {
        // Xóa bot_token trước khi trả về (không cần thiết cho frontend)
        const { bot_token, ...configWithoutBotToken } = config;
        config = configWithoutBotToken;
      }
    } else {
      config = await TelegramConfigurationService.getByUser(session.user.id);
    }

    // Lấy botUsername từ global config để hiển thị cho property owner
    const botConfig = await TelegramBotConfigService.get();
    if (botConfig && botConfig.ten_bot) {
      config = { ...config, ten_bot: botConfig.ten_bot };
    }

    return NextResponse.json(
      { data: config },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get telegram config error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy cấu hình telegram' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/telegram-config
 * Tạo hoặc cập nhật cấu hình telegram (Property Owner only)
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.5, 7.1, 7.2, 7.3
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ property owner mới có thể cấu hình telegram
    if (session.user.vai_tro !== 'CHU_NHA_TRO') {
      logAuthorizationViolation(
        request,
        session,
        'Property Owner access required for telegram configuration'
      );
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTelegramConfigSchema.parse(body);

    const config = await TelegramConfigurationService.upsert(
      session.user.id,
      validatedData
    );

    return NextResponse.json(
      { data: config, message: 'Cấu hình telegram đã được lưu thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create/Update telegram config error:', error);

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
      { error: error.message || 'Đã xảy ra lỗi khi lưu cấu hình telegram' },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/telegram-config
 * Cập nhật cấu hình telegram (Property Owner only)
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.5, 7.1, 7.2, 7.3
 */
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ property owner mới có thể cấu hình telegram
    if (session.user.vai_tro !== 'CHU_NHA_TRO') {
      logAuthorizationViolation(
        request,
        session,
        'Property Owner access required for telegram configuration'
      );
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateTelegramConfigSchema.parse(body);

    // Merge với dữ liệu hiện tại nếu có
    const existing = await TelegramConfigurationService.getDecryptedByUser(session.user.id);
    const mergedData = existing
      ? { ...existing, ...validatedData, nguoi_dung_id: session.user.id }
      : { ...validatedData };

    const config = await TelegramConfigurationService.upsert(
      session.user.id,
      mergedData
    );

    return NextResponse.json(
      { data: config, message: 'Cấu hình telegram đã được cập nhật thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update telegram config error:', error);

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
      { error: error.message || 'Đã xảy ra lỗi khi cập nhật cấu hình telegram' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/telegram-config
 * Xóa cấu hình telegram (Property Owner only)
 * Requirements: 2.1, 2.3, 6.1, 6.5, 7.1, 7.2
 */
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ property owner mới có thể cấu hình telegram
    if (session.user.vai_tro !== 'CHU_NHA_TRO') {
      logAuthorizationViolation(
        request,
        session,
        'Property Owner access required for telegram configuration'
      );
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    await TelegramConfigurationService.delete(session.user.id);

    return NextResponse.json(
      { message: 'Cấu hình telegram đã được xóa thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete telegram config error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi khi xóa cấu hình telegram' },
      { status: 400 }
    );
  }
}
