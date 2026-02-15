import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { EmailConfigurationService } from '@/lib/services/email-configuration.service.js';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * DELETE /api/admin/email-config/:id
 * Xóa cấu hình email (Super Admin only)
 * Requirements: 1.1, 1.3, 5.5, 7.1, 7.2
 */
export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.vai_tro !== 'SIEU_QUAN_TRI') {
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

    const { id } = params;

    await EmailConfigurationService.delete(id);

    return NextResponse.json(
      { message: 'Cấu hình email đã được xóa thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete email config error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi khi xóa cấu hình email' },
      { status: 400 }
    );
  }
}
