import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDashboardStats } from '@/lib/dashboard/getDashboardStats';
import { isSuperAdmin } from '@/lib/middleware/authorization';

/**
 * GET /api/dashboard/stats
 * Lấy thống kê tổng quan cho Dashboard (scoped to property owner)
 * Requirements: 13.1-13.11, 5.4, 5.5
 */
export async function GET(request) {
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
        // For Super Admin, use userId from query param if provided
        const { searchParams } = new URL(request.url);
        const queryUserId = searchParams.get('userId');

        let targetUserId = session.user.id;
        if (isSuperAdmin(session)) {
            targetUserId = queryUserId && queryUserId !== 'all' ? queryUserId : null;
        }

        const stats = await getDashboardStats(targetUserId);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Lỗi API /api/dashboard/stats:', error);
        return NextResponse.json(
            { error: 'Không thể tải thống kê dashboard' },
            { status: 500 }
        );
    }
}
