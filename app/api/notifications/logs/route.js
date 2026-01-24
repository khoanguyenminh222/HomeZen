import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getNotificationLogs } from '@/lib/services/notification-log.service.js';
import { logUnauthorizedAccess } from '@/lib/middleware/security-logging';
import { isSuperAdmin } from '@/lib/middleware/authorization';

/**
 * GET /api/notifications/logs
 * Lấy danh sách notification logs
 * Requirements: 7.1, 7.2
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // EMAIL hoặc TELEGRAM
    const status = searchParams.get('status'); // PENDING, SENT, FAILED, RETRY
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Property owners chỉ xem logs của mình, Super Admin xem tất cả
    const userId = isSuperAdmin(session) ? null : session.user.id;

    const logs = await getNotificationLogs({
      userId,
      type,
      status,
      limit,
      offset,
    });

    return NextResponse.json(
      { data: logs },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get notification logs error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách notification logs' },
      { status: 500 }
    );
  }
}
