import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { RoomClosureNotificationService } from '@/lib/services/room-closure-notification.service.js';
import { requireAuth } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess } from '@/lib/middleware/security-logging';

/**
 * POST /api/notifications/room-closure
 * Kiểm tra và gửi thông báo chốt sổ phòng (Property Owner hoặc Super Admin)
 * Requirements: 3.1, 3.2, 8.1
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { so_ngay_truoc = 1 } = body;

    // SIEU_QUAN_TRI có thể test cho tất cả, CHU_NHA_TRO chỉ test cho phòng của mình
    const nguoi_dung_id = session.user.vai_tro === 'SIEU_QUAN_TRI' ? null : session.user.id;

    const result = await RoomClosureNotificationService.checkAndNotifyRoomClosures(
      parseInt(so_ngay_truoc),
      nguoi_dung_id
    );

    return NextResponse.json(
      {
        success: true,
        message: `Đã kiểm tra và gửi thông báo cho ${result.tong_so_chu_tro} chủ trọ`,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Room closure notification error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gửi thông báo chốt sổ' },
      { status: 500 }
    );
  }
}
