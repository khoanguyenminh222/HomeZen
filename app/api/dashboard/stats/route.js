import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDashboardStats } from '@/lib/dashboard/getDashboardStats';
import { isSuperAdmin } from '@/lib/middleware/authorization';

/**
 * GET /api/dashboard/stats
 * Lấy thống kê tổng quan cho Dashboard (scoped to property owner)
 * Requirements: 13.1-13.11, 5.4, 5.5
 */
export async function GET() {
    try {
        // Check authentication
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // For Property Owners, scope stats to their property
        // For Super Admin, return all stats
        const userId = isSuperAdmin(session) ? null : session.user.id;
        const stats = await getDashboardStats(userId);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Lỗi API /api/dashboard/stats:', error);
        return NextResponse.json(
            { error: 'Không thể tải thống kê dashboard' },
            { status: 500 }
        );
    }
}
