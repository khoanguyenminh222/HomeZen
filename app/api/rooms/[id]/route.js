import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateRoomSchema } from '@/lib/validations/room';
import { validateResourceOwnership, isSuperAdmin } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * GET /api/rooms/[id] - Lấy chi tiết phòng
 * Requirements: 2.6, 5.1, 5.2
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
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

    // Validate property access
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, id, 'room');
      if (!hasAccess) {
        logAuthorizationViolation(request, session, `No access to room ${id}`, id, 'room');
        return NextResponse.json(
          { error: 'Forbidden: No access to this room' },
          { status: 403 }
        );
      }
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
 * Requirements: 2.7, 5.1, 5.2
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
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

    // Validate property access
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, id, 'room');
      if (!hasAccess) {
        logAuthorizationViolation(request, session, `No access to room ${id}`, id, 'room');
        return NextResponse.json(
          { error: 'Forbidden: No access to this room' },
          { status: 403 }
        );
      }
    }

    // If updating code, check uniqueness within the same property owner (Requirements: 2.2)
    if (validatedData.code && validatedData.code !== existingRoom.code) {
      const roomWithSameCode = await prisma.room.findFirst({
        where: { 
          code: validatedData.code,
          userId: existingRoom.userId
        },
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
 * Requirements: 2.8, 2.9, 5.1, 5.2 - Không cho phép xóa phòng có người thuê
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
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

    // Validate property access
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, id, 'room');
      if (!hasAccess) {
        logAuthorizationViolation(request, session, `No access to room ${id}`, id, 'room');
        return NextResponse.json(
          { error: 'Forbidden: No access to this room' },
          { status: 403 }
        );
      }
    }

    // Check if room is occupied (Requirements: 2.9)
    if (room.status === 'OCCUPIED') {
      return NextResponse.json(
        { error: 'Không thể xóa phòng đang có người thuê' },
        { status: 400 }
      );
    }

    // Check if room has tenant (double check for safety)
    const tenant = await prisma.tenant.findUnique({
      where: { roomId: id },
    });

    if (tenant) {
      return NextResponse.json(
        { error: 'Không thể xóa phòng vì còn người thuê' },
        { status: 400 }
      );
    }

    // Check if room has bills
    const billCount = await prisma.bill.count({
      where: { roomId: id },
    });

    if (billCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa phòng vì còn ${billCount} hóa đơn liên quan. Vui lòng xóa các hóa đơn trước.` },
        { status: 400 }
      );
    }

    // Delete room (RoomFee will be cascade deleted automatically)
    await prisma.room.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Xóa phòng thành công' });
  } catch (error) {
    console.error('Error deleting room:', error);
    
    // Handle foreign key constraint error
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Không thể xóa phòng vì còn dữ liệu liên quan (hóa đơn, người thuê, v.v.)' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi xóa phòng' },
      { status: 500 }
    );
  }
}
