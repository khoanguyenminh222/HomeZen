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

    // Add user filter for Property Owners
    const queryOptions = await addUserFilter({
      where,
      orderBy: { code: 'asc' },
    }, session.user.id);

    // Fetch rooms
    const rooms = await prisma.room.findMany(queryOptions);

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
    const dataToCreate = { ...validatedData };
    if (!isSuperAdmin(session)) {
      // Property owners can only create rooms for their own property
      // First verify the user exists in the database
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      
      if (!userExists) {
        logAuthorizationViolation(request, session.user.id, 'User not found in database');
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }
      
      dataToCreate.userId = session.user.id;
      delete dataToCreate.propertyId; // Remove propertyId if schema allows it
    } else {
      // Super Admin can specify userId or leave it null
      if (dataToCreate.propertyId) {
        // If propertyId is provided, we need to find the userId
        // But in new model, we use userId directly
        delete dataToCreate.propertyId;
      }
      
      // If userId is specified for Super Admin, verify it exists
      if (dataToCreate.userId) {
        const userExists = await prisma.user.findUnique({
          where: { id: dataToCreate.userId }
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
    const existingRoom = await prisma.room.findFirst({
      where: { 
        code: validatedData.code,
        userId: dataToCreate.userId || null
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Mã phòng đã tồn tại trong property này' },
        { status: 400 }
      );
    }

    // Create room
    const room = await prisma.room.create({
      data: dataToCreate,
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
