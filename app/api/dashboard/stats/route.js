import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/dashboard/getDashboardStats';

/**
 * GET /api/dashboard/stats
 * Lấy thống kê tổng quan cho Dashboard
 * Requirements: 13.1-13.11
 */
export async function GET() {
    try {
        const stats = await getDashboardStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Lỗi API /api/dashboard/stats:', error);
        return NextResponse.json(
            { error: 'Không thể tải thống kê dashboard' },
            { status: 500 }
        );
    }
}
