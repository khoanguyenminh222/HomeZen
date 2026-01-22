import { NextResponse } from 'next/server';
import { getMeterReadingReminders } from '@/lib/dashboard/getMeterReadingReminders';

/**
 * GET /api/dashboard/reminders
 * Lấy danh sách nhắc nhở chốt số điện nước
 * Requirements: 13.6-13.8
 */
export async function GET() {
    try {
        const reminders = await getMeterReadingReminders();

        return NextResponse.json(reminders);
    } catch (error) {
        console.error('Lỗi API /api/dashboard/reminders:', error);
        return NextResponse.json(
            { error: 'Không thể tải danh sách nhắc nhở' },
            { status: 500 }
        );
    }
}
