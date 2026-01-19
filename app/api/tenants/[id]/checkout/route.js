import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { depositReturnSchema } from '@/lib/validations/tenant';

// POST /api/tenants/[id]/checkout - Trả phòng (Hủy liên kết phòng)
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json().catch(() => ({}));

        // Kiểm tra người thuê có tồn tại không
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                room: true
            }
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Không tìm thấy người thuê' },
                { status: 404 }
            );
        }

        if (!tenant.roomId) {
            return NextResponse.json(
                { error: 'Người thuê này hiện không ở phòng nào' },
                { status: 400 }
            );
        }

        // Xử lý trong transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Tạo record hoàn trả cọc nếu có thông tin
            if (body.depositReturn) {
                const depositData = depositReturnSchema.parse(body.depositReturn);

                await tx.depositReturn.create({
                    data: {
                        amount: depositData.amount,
                        method: depositData.method,
                        notes: depositData.notes || null,
                        tenantId: tenant.id
                    }
                });
            }

            // 2. Cập nhật trạng thái phòng thành EMPTY
            await tx.room.update({
                where: { id: tenant.roomId },
                data: { status: 'EMPTY' }
            });

            // 3. Unlink người thuê khỏi phòng (set roomId = null)
            await tx.tenant.update({
                where: { id },
                data: { roomId: null }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking out tenant:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    error: 'Thông tin hoàn trả cọc không hợp lệ',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Lỗi khi thực hiện trả phòng' },
            { status: 500 }
        );
    }
}
