import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createRoomSchema } from '@/lib/validations/room';
import { addUserFilter, isSuperAdmin } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

/**
 * GET /api/rooms - Lấy danh sách phòng
 * Requirements: 2.5, 2.10, 2.11, 5.1, 5.2
 * Query params: status (EMPTY|OCCUPIED), search (string)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');

    // Build where clause
    const where = {};

    // Validate and apply status filter
    if (statusParam && (statusParam === 'TRONG' || statusParam === 'DA_THUE')) {
      where.trang_thai = statusParam;
    }

    // Apply search filter
    if (searchParam && searchParam.trim()) {
      where.OR = [
        { ma_phong: { contains: searchParam.trim(), mode: 'insensitive' } },
        { ten_phong: { contains: searchParam.trim(), mode: 'insensitive' } },
      ];
    }

    // Add user filter for Property Owners
    const queryOptions = await addUserFilter({
      where,
      orderBy: { ma_phong: 'asc' },
    }, session.user.id);

    // Fetch rooms
    const rooms = await prisma.pRP_PHONG.findMany(queryOptions);

    // Convert Decimal to number for JSON serialization
    const roomsWithNumbers = rooms.map(room => ({
      ...room,
      gia_phong: Number(room.gia_phong),
    }));

    return NextResponse.json(roomsWithNumbers);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách phòng' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms - Tạo phòng mới
 * Requirements: 2.1, 2.2, 5.1, 5.2
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createRoomSchema.parse(body);

    // For Property Owners, automatically set userId (remove propertyId if present)
    let dataToCreate = { ...validatedData };
    if (!isSuperAdmin(session)) {
      // Property owners can only create rooms for their own property
      // First verify the user exists in the database
      const userExists = await prisma.uSR_NGUOI_DUNG.findUnique({
        where: { id: session.user.id }
      });

      if (!userExists) {
        logAuthorizationViolation(request, session, 'User not found in database');
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }

      dataToCreate.nguoi_dung_id = session.user.id;
      // remove propertyId if present
      const { propertyId, ...rest } = dataToCreate;
      dataToCreate = rest;
    } else {
      // Super Admin can specify userId or leave it null
      // But in new model, we use userId directly
      const { propertyId, ...rest } = dataToCreate;
      dataToCreate = rest;


      // If userId is specified for Super Admin, verify it exists
      if (dataToCreate.nguoi_dung_id) {
        const userExists = await prisma.uSR_NGUOI_DUNG.findUnique({
          where: { id: dataToCreate.nguoi_dung_id }
        });

        if (!userExists) {
          return NextResponse.json(
            { error: 'Specified user not found' },
            { status: 400 }
          );
        }
      }
    }

    // Check if room code already exists within the same property owner (Requirements: 2.2)
    const existingRoom = await prisma.pRP_PHONG.findFirst({
      where: {
        ma_phong: validatedData.ma_phong,
        nguoi_dung_id: dataToCreate.nguoi_dung_id || null,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Mã phòng đã tồn tại trong property này' },
        { status: 400 }
      );
    }

    // Create room
    const room = await prisma.pRP_PHONG.create({
      data: {
        ma_phong: validatedData.ma_phong,
        ten_phong: validatedData.ten_phong,
        gia_phong: validatedData.gia_phong,
        trang_thai: validatedData.trang_thai,
        ngay_chot_so: validatedData.ngay_chot_so,
        max_dong_ho_dien: validatedData.max_dong_ho_dien,
        max_dong_ho_nuoc: validatedData.max_dong_ho_nuoc,
        nguoi_dung_id: dataToCreate.nguoi_dung_id,
      },
    });

    // Convert Decimal to number
    const roomWithNumber = {
      ...room,
      gia_phong: Number(room.gia_phong),
    };

    return NextResponse.json(roomWithNumber, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi tạo phòng' },
      { status: 500 }
    );
  }
}
