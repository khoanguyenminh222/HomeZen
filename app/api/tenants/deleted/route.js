import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/tenants/deleted - Danh sách người thuê đã xóa tạm thời
export async function GET(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        // Xây dựng where clause
        const where = {
            ngay_xoa: { not: null }
        };

        if (search) {
            where.OR = [
                { ho_ten: { contains: search, mode: 'insensitive' } },
                { dien_thoai: { contains: search } }
            ];
        }

        const tenants = await prisma.tNT_NGUOI_THUE_CHINH.findMany({
            where,
            include: {
                // Toà nhà có thể có ích nếu muốn hiện thêm info
                _count: {
                    select: {
                        nguoi_o: true
                    }
                }
            },
            orderBy: {
                ngay_xoa: 'desc'
            }
        });

        const transformedTenants = tenants.map(tenant => ({
            ...tenant,
            tien_coc: tenant.tien_coc ? parseFloat(tenant.tien_coc) : null
        }));

        return NextResponse.json(transformedTenants);
    } catch (error) {
        console.error('Error fetching deleted tenants:', error);
        return NextResponse.json(
            { error: 'Lỗi khi lấy danh sách người thuê đã xóa' },
            { status: 500 }
        );
    }
}
