import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TenantService } from '@/lib/services/tenant.service';

// POST /api/tenants/[id]/restore - Khôi phục người thuê
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id || session.user.email || 'Admin';

        const restoredTenant = await TenantService.restore(id, userId);

        return NextResponse.json({
            success: true,
            message: 'Đã khôi phục người thuê',
            tenant: restoredTenant
        });
    } catch (error) {
        console.error('Error restoring tenant:', error);

        if (error.message === 'TENANT_NOT_FOUND') {
            return NextResponse.json({ error: 'Không tìm thấy người thuê' }, { status: 404 });
        }
        if (error.message === 'TENANT_NOT_DELETED') {
            return NextResponse.json({ error: 'Người thuê này hiện không ở trạng thái bị xóa' }, { status: 400 });
        }

        return NextResponse.json(
            { error: 'Lỗi khi khôi phục người thuê' },
            { status: 500 }
        );
    }
}
