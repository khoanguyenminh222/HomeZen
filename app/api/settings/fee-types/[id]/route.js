import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateFeeTypeSchema } from '@/lib/validations/feeType';

// GET /api/settings/fee-types/[id] - Chi tiết loại phí
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const feeType = await prisma.bIL_LOAI_PHI.findUnique({
      where: { id },
      include: {
        _count: {
          select: { phi_phong: true }
        }
      }
    });

    if (!feeType) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại phí' },
        { status: 404 }
      );
    }

    return NextResponse.json(feeType);
  } catch (error) {
    console.error('Error fetching fee type:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin loại phí' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/fee-types/[id] - Cập nhật loại phí
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateFeeTypeSchema.parse(body);

    // Kiểm tra loại phí có tồn tại không
    const existing = await prisma.bIL_LOAI_PHI.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại phí' },
        { status: 404 }
      );
    }

    // Nếu đổi tên, kiểm tra tên mới có trùng không
    if (validatedData.ten_phi && validatedData.ten_phi !== existing.ten_phi) {
      const nameExists = await prisma.bIL_LOAI_PHI.findUnique({
        where: { ten_phi: validatedData.ten_phi }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Tên loại phí này đã tồn tại' },
          { status: 400 }
        );
      }
    }

    const feeType = await prisma.bIL_LOAI_PHI.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(feeType);
  } catch (error) {
    console.error('Error updating fee type:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật loại phí' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/fee-types/[id] - Xóa loại phí
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Kiểm tra loại phí có tồn tại không
    const feeType = await prisma.bIL_LOAI_PHI.findUnique({
      where: { id },
      include: {
        _count: {
          select: { phi_phong: true }
        }
      }
    });

    if (!feeType) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại phí' },
        { status: 404 }
      );
    }

    // Kiểm tra xem có phòng nào đang sử dụng loại phí này không
    if (feeType._count.phi_phong > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa loại phí đang được sử dụng bởi các phòng' },
        { status: 400 }
      );
    }

    await prisma.bIL_LOAI_PHI.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Đã xóa loại phí thành công' });
  } catch (error) {
    console.error('Error deleting fee type:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa loại phí' },
      { status: 500 }
    );
  }
}
