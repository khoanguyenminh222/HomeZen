import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createFeeTypeSchema } from '@/lib/validations/feeType';
import { addUserFilter, isSuperAdmin } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

// GET /api/settings/fee-types - Danh sách loại phí
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    // Add user filter for Property Owners
    const queryOptions = await addUserFilter({
      where,
      orderBy: { name: 'asc' },
    }, session.user.id);

    const feeTypes = await prisma.feeType.findMany(queryOptions);

    return NextResponse.json(feeTypes);
  } catch (error) {
    console.error('Error fetching fee types:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách loại phí' },
      { status: 500 }
    );
  }
}

// POST /api/settings/fee-types - Tạo loại phí mới
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFeeTypeSchema.parse(body);

    // For Property Owners, automatically set userId (remove propertyId if present)
    const dataToCreate = { ...validatedData };
    if (!isSuperAdmin(session)) {
      // Property owners can only create fee types for their own property
      dataToCreate.userId = session.user.id;
      delete dataToCreate.propertyId; // Remove propertyId if schema allows it
    } else {
      // Super Admin can specify userId or leave it null
      if (dataToCreate.propertyId) {
        // If propertyId is provided, we need to find the userId
        // But in new model, we use userId directly
        delete dataToCreate.propertyId;
      }
    }

    // Kiểm tra tên loại phí đã tồn tại chưa trong cùng property owner
    const existing = await prisma.feeType.findFirst({
      where: { 
        name: validatedData.name,
        userId: dataToCreate.userId || null
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Loại phí này đã tồn tại' },
        { status: 400 }
      );
    }

    const feeType = await prisma.feeType.create({
      data: dataToCreate
    });

    return NextResponse.json(feeType, { status: 201 });
  } catch (error) {
    console.error('Error creating fee type:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi tạo loại phí' },
      { status: 500 }
    );
  }
}
