import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateRoomFeeSchema } from '@/lib/validations/roomFee';

// PUT /api/rooms/[id]/fees/[feeId] - Cập nhật phí của phòng
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId, feeId } = await params;
    const body = await request.json();
    const validatedData = updateRoomFeeSchema.parse(body);

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Kiểm tra phí có tồn tại và thuộc về phòng này không
    const roomFee = await prisma.bIL_PHI_PHONG.findUnique({
      where: { id: feeId }
    });

    if (!roomFee || roomFee.phong_id !== roomId) {
      return NextResponse.json(
        { error: 'Không tìm thấy phí của phòng' },
        { status: 404 }
      );
    }

    const updated = await prisma.bIL_PHI_PHONG.update({
      where: { id: feeId },
      data: validatedData,
      include: {
        loai_phi: true
      }
    });

    return NextResponse.json({
      ...updated,
      so_tien: Number(updated.so_tien),
    });
  } catch (error) {
    console.error('Error updating room fee:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật phí của phòng' },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[id]/fees/[feeId] - Xóa phí của phòng
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId, feeId } = await params;

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Kiểm tra phí có tồn tại và thuộc về phòng này không
    const roomFee = await prisma.bIL_PHI_PHONG.findUnique({
      where: { id: feeId }
    });

    if (!roomFee || roomFee.phong_id !== roomId) {
      return NextResponse.json(
        { error: 'Không tìm thấy phí của phòng' },
        { status: 404 }
      );
    }

    await prisma.bIL_PHI_PHONG.delete({
      where: { id: feeId }
    });

    return NextResponse.json({ message: 'Đã xóa phí của phòng thành công' });
  } catch (error) {
    console.error('Error deleting room fee:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa phí của phòng' },
      { status: 500 }
    );
  }
}
