import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware/authorization';
import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/rooms/list
 * Trả về danh sách phòng cho dropdown ROOM_SELECT
 * Requirement 1.3, 6.8
 */
async function listRoomsHandler(request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Lấy thông tin người dùng để biết họ có quyền xem phòng nào (nếu cần)
        const user = await prisma.uSR_NGUOI_DUNG.findUnique({
            where: { id: userId },
            select: { vai_tro: true }
        });

        const isSuperAdmin = user?.vai_tro === 'SIEU_QUAN_TRI';

        // Fetch rooms
        const rooms = await prisma.pRP_PHONG.findMany({
            where: isSuperAdmin ? {} : {
                nguoi_dung_id: userId
            },
            select: {
                id: true,
                ten_phong: true
            },
            orderBy: {
                ten_phong: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: rooms.map(r => ({
                id: r.id,
                ten: r.ten_phong
            }))
        });
    } catch (error) {
        console.error('Error listing rooms:', error);
        return NextResponse.json({
            success: false,
            error: 'Không thể tải danh sách phòng'
        }, { status: 500 });
    }
}

export const GET = requireAuth(listRoomsHandler);
