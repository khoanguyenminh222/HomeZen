import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { TenantService } from '@/lib/services/tenant.service';

// DELETE /api/tenants/[id]/permanent - Xóa vĩnh viễn
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id || session.user.email || 'Admin';

        await TenantService.permanentDelete(id, userId);

        return NextResponse.json({
            success: true,
            message: 'Đã xóa vĩnh viễn người thuê và các dữ liệu liên quan'
        });
    } catch (error) {
        console.error('Error permanently deleting tenant:', error);

        if (error.message === 'TENANT_NOT_FOUND') {
            return NextResponse.json({ error: 'Không tìm thấy người thuê' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Lỗi khi xóa vĩnh viễn người thuê' },
            { status: 500 }
        );
    }
}
