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
      where.trang_thai = true;
    }

    // Add user filter for Property Owners
    const queryOptions = await addUserFilter({
      where,
      orderBy: { ten_phi: 'asc' },
    }, session.user.id);

    const feeTypes = await prisma.bIL_LOAI_PHI.findMany(queryOptions);

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

    // For Property Owners, automatically set nguoi_dung_id
    const dataToCreate = { ...validatedData };
    if (!isSuperAdmin(session)) {
      // Property owners can only create fee types for their own property
      dataToCreate.nguoi_dung_id = session.user.id;
    } else {
      // Super Admin can specify nguoi_dung_id or leave it null
      // In new model, we use nguoi_dung_id directly
    }

    // Kiểm tra tên loại phí đã tồn tại chưa trong cùng property owner
    const existing = await prisma.bIL_LOAI_PHI.findFirst({
      where: {
        ten_phi: validatedData.ten_phi,
        nguoi_dung_id: dataToCreate.nguoi_dung_id || null
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Loại phí này đã tồn tại' },
        { status: 400 }
      );
    }

    const feeType = await prisma.bIL_LOAI_PHI.create({
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
