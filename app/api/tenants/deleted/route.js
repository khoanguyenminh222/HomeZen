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
            deletedAt: { not: null }
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } }
            ];
        }

        const tenants = await prisma.tenant.findMany({
            where,
            include: {
                // Room won't be assigned, but we might have roomId stored in deleted metadata if we wanted (not in schema yet)
                // For now just get original fields
                _count: {
                    select: {
                        occupants: true
                    }
                }
            },
            orderBy: {
                deletedAt: 'desc'
            }
        });

        const transformedTenants = tenants.map(tenant => ({
            ...tenant,
            deposit: tenant.deposit ? parseFloat(tenant.deposit) : null
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
