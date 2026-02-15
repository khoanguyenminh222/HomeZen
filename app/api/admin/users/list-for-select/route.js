import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import prisma from '@/lib/prisma';

async function listUsersHandler() {
    try {
        const users = await prisma.uSR_NGUOI_DUNG.findMany({
            where: {
                trang_thai: true,
                vai_tro: 'CHU_NHA_TRO'
            },
            select: {
                id: true,
                tai_khoan: true,
                thong_tin_nha_tro: {
                    select: {
                        ten_chu_nha: true
                    }
                }
            },
            orderBy: {
                tai_khoan: 'asc'
            }
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            tai_khoan: user.tai_khoan,
            ten_hien_thi: user.thong_tin_nha_tro?.ten_chu_nha || user.tai_khoan
        }));

        return NextResponse.json({ success: true, users: formattedUsers });
    } catch (error) {
        console.error('Error listing users:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to list users' },
            { status: 500 }
        );
    }
}

export const GET = requireSuperAdmin(listUsersHandler);
