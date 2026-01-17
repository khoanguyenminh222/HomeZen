import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createRoomSchema } from '@/lib/validations/room';

/**
 * GET /api/rooms - Lấy danh sách phòng
 * Requirements: 2.5, 2.10, 2.11
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
    if (statusParam && (statusParam === 'EMPTY' || statusParam === 'OCCUPIED')) {
      where.status = statusParam;
    }
    
    // Apply search filter
    if (searchParam && searchParam.trim()) {
      where.OR = [
        { code: { contains: searchParam.trim(), mode: 'insensitive' } },
        { name: { contains: searchParam.trim(), mode: 'insensitive' } },
      ];
    }

    // Fetch rooms
    const rooms = await prisma.room.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    // Convert Decimal to number for JSON serialization
    const roomsWithNumbers = rooms.map(room => ({
      ...room,
      price: Number(room.price),
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
 * Requirements: 2.1, 2.2
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createRoomSchema.parse(body);

    // Check if room code already exists (Requirements: 2.2)
    const existingRoom = await prisma.room.findUnique({
      where: { code: validatedData.code },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Mã phòng đã tồn tại' },
        { status: 400 }
      );
    }

    // Create room
    const room = await prisma.room.create({
      data: validatedData,
    });

    // Convert Decimal to number
    const roomWithNumber = {
      ...room,
      price: Number(room.price),
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
