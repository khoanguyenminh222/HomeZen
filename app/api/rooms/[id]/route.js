import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateRoomSchema } from '@/lib/validations/room';

/**
 * GET /api/rooms/[id] - Lấy chi tiết phòng
 * Requirements: 2.6
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: id },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Convert Decimal to number
    const roomWithNumber = {
      ...room,
      price: Number(room.price),
    };

    return NextResponse.json(roomWithNumber);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin phòng' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rooms/[id] - Cập nhật phòng
 * Requirements: 2.7
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateRoomSchema.parse(body);

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: id },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // If updating code, check uniqueness (Requirements: 2.2)
    if (validatedData.code && validatedData.code !== existingRoom.code) {
      const roomWithSameCode = await prisma.room.findUnique({
        where: { code: validatedData.code },
      });

      if (roomWithSameCode) {
        return NextResponse.json(
          { error: 'Mã phòng đã tồn tại' },
          { status: 400 }
        );
      }
    }

    // Update room
    const room = await prisma.room.update({
      where: { id: id },
      data: validatedData,
    });

    // Convert Decimal to number
    const roomWithNumber = {
      ...room,
      price: Number(room.price),
    };

    return NextResponse.json(roomWithNumber);
  } catch (error) {
    console.error('Error updating room:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật phòng' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rooms/[id] - Xóa phòng
 * Requirements: 2.8, 2.9 - Không cho phép xóa phòng có người thuê
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: id },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Check if room is occupied (Requirements: 2.9)
    if (room.status === 'OCCUPIED') {
      return NextResponse.json(
        { error: 'Không thể xóa phòng đang có người thuê' },
        { status: 400 }
      );
    }

    // Delete room
    await prisma.room.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Xóa phòng thành công' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa phòng' },
      { status: 500 }
    );
  }
}
