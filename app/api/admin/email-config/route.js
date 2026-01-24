import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { EmailConfigurationService } from '@/lib/services/email-configuration.service.js';
import { createEmailConfigSchema, updateEmailConfigSchema } from '@/lib/validations/notification-config.js';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * GET /api/admin/email-config
 * Lấy cấu hình email hiện tại (Super Admin only)
 * Query params: ?decrypted=true để lấy config đã decrypt (không có password)
 * Requirements: 1.1, 1.3, 5.5, 7.1, 7.2, 7.5
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
        'Super Admin access required for email configuration'
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
      // Lấy config đã decrypt (có password để hiển thị)
      config = await EmailConfigurationService.getDecrypted();
    } else {
      config = await EmailConfigurationService.get();
    }

    return NextResponse.json(
      { data: config },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get email config error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy cấu hình email' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email-config
 * Tạo cấu hình email mới (Super Admin only)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.5, 7.1, 7.2, 7.3
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
        'Super Admin access required for email configuration'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createEmailConfigSchema.parse(body);

    const config = await EmailConfigurationService.create(
      validatedData,
      session.user.id
    );

    return NextResponse.json(
      { data: config, message: 'Cấu hình email đã được tạo thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create email config error:', error);
    
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
      { error: error.message || 'Đã xảy ra lỗi khi tạo cấu hình email' },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/admin/email-config
 * Cập nhật cấu hình email (Super Admin only)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.5, 7.1, 7.2, 7.3
 */
export async function PUT(request) {
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
        'Super Admin access required for email configuration'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...configData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID cấu hình email là bắt buộc' },
        { status: 400 }
      );
    }

    const validatedData = updateEmailConfigSchema.parse(configData);

    const config = await EmailConfigurationService.update(id, validatedData);

    return NextResponse.json(
      { data: config, message: 'Cấu hình email đã được cập nhật thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update email config error:', error);
    
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
      { error: error.message || 'Đã xảy ra lỗi khi cập nhật cấu hình email' },
      { status: 400 }
    );
  }
}
