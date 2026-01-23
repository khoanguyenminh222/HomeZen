import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createRoomFeeSchema } from '@/lib/validations/roomFee';
import { validateResourceOwnership } from '@/lib/middleware/authorization';

// GET /api/rooms/[id]/fees - Lấy danh sách phí của phòng
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Validate property access
    const hasAccess = await validateResourceOwnership(session.user.id, roomId, 'room');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this room' },
        { status: 403 }
      );
    }

    const where = { roomId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const roomFees = await prisma.roomFee.findMany({
      where,
      include: {
        feeType: true
      },
      orderBy: {
        feeType: {
          name: 'asc'
        }
      }
    });

    // Convert Decimal to number
    const roomFeesWithNumbers = roomFees.map(fee => ({
      ...fee,
      amount: Number(fee.amount),
    }));

    return NextResponse.json(roomFeesWithNumbers);
  } catch (error) {
    console.error('Error fetching room fees:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách phí của phòng' },
      { status: 500 }
    );
  }
}

// POST /api/rooms/[id]/fees - Gán phí cho phòng
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;
    const body = await request.json();
    const validatedData = createRoomFeeSchema.parse(body);

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Validate property access for room
    const hasRoomAccess = await validateResourceOwnership(session.user.id, roomId, 'room');
    if (!hasRoomAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this room' },
        { status: 403 }
      );
    }

    // Kiểm tra loại phí có tồn tại không
    const feeType = await prisma.feeType.findUnique({
      where: { id: validatedData.feeTypeId }
    });

    if (!feeType) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại phí' },
        { status: 404 }
      );
    }

    // Validate feeType ownership (must be same property owner as room)
    if (feeType.userId !== room.userId) {
      return NextResponse.json(
        { error: 'Loại phí không thuộc cùng property owner với phòng' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng đã có phí này chưa
    const existing = await prisma.roomFee.findUnique({
      where: {
        roomId_feeTypeId: {
          roomId,
          feeTypeId: validatedData.feeTypeId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Phòng này đã có loại phí này' },
        { status: 400 }
      );
    }

    const roomFee = await prisma.roomFee.create({
      data: {
        roomId,
        feeTypeId: validatedData.feeTypeId,
        amount: validatedData.amount,
        isActive: validatedData.isActive,
      },
      include: {
        feeType: true
      }
    });

    return NextResponse.json({
      ...roomFee,
      amount: Number(roomFee.amount),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating room fee:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi gán phí cho phòng' },
      { status: 500 }
    );
  }
}
