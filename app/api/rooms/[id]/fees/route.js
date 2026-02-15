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
    const room = await prisma.pRP_PHONG.findUnique({
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

    const where = { phong_id: roomId };
    if (!includeInactive) {
      where.trang_thai = true;
    }

    const roomFees = await prisma.bIL_PHI_PHONG.findMany({
      where,
      include: {
        loai_phi: true
      },
      orderBy: {
        loai_phi: {
          ten_phi: 'asc'
        }
      }
    });

    // Convert Decimal to number
    const roomFeesWithNumbers = roomFees.map(fee => ({
      ...fee,
      so_tien: Number(fee.so_tien),
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
    const room = await prisma.pRP_PHONG.findUnique({
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
    const feeType = await prisma.bIL_LOAI_PHI.findUnique({
      where: { id: validatedData.loai_phi_id }
    });

    if (!feeType) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại phí' },
        { status: 404 }
      );
    }

    // Validate feeType ownership (must be same property owner as room)
    if (feeType.nguoi_dung_id !== room.nguoi_dung_id) {
      return NextResponse.json(
        { error: 'Loại phí không thuộc cùng property owner với phòng' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng đã có phí này chưa
    const existing = await prisma.bIL_PHI_PHONG.findUnique({
      where: {
        phong_id_loai_phi_id: {
          phong_id: roomId,
          loai_phi_id: validatedData.loai_phi_id
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Phòng này đã có loại phí này' },
        { status: 400 }
      );
    }

    const roomFee = await prisma.bIL_PHI_PHONG.create({
      data: {
        phong_id: roomId,
        loai_phi_id: validatedData.loai_phi_id,
        so_tien: validatedData.so_tien,
        trang_thai: validatedData.trang_thai,
      },
      include: {
        loai_phi: true
      }
    });

    return NextResponse.json({
      ...roomFee,
      so_tien: Number(roomFee.so_tien),
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
