import { NextResponse } from 'next/server';
import { RoomClosureNotificationService } from '@/lib/services/room-closure-notification.service.js';

/**
 * Cron job API route để tự động gửi thông báo nhắc chốt số
 * Route này sẽ được Vercel Cron Jobs gọi hàng ngày
 * 
 * Bảo mật: Kiểm tra Authorization header để chỉ Vercel có thể gọi
 */
export async function GET(request) {
  try {
    // Kiểm tra Authorization header (Vercel Cron Jobs sẽ gửi secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Gửi thông báo cho các phòng còn 1 ngày nữa đến ngày chốt số
    const result = await RoomClosureNotificationService.checkAndNotifyRoomClosures(1);

    return NextResponse.json(
      {
        success: true,
        message: `Đã tự động gửi thông báo cho ${result.totalUsers} chủ trọ`,
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job room closure notification error:', error);
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi gửi thông báo chốt sổ',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Hỗ trợ POST method (nếu cần)
export async function POST(request) {
  return GET(request);
}
