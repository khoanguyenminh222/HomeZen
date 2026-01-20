import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createFeeTypeSchema } from '@/lib/validations/feeType';

// GET /api/settings/fee-types - Danh sách loại phí
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const feeTypes = await prisma.feeType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFeeTypeSchema.parse(body);

    // Kiểm tra tên loại phí đã tồn tại chưa
    const existing = await prisma.feeType.findUnique({
      where: { name: validatedData.name }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Loại phí này đã tồn tại' },
        { status: 400 }
      );
    }

    const feeType = await prisma.feeType.create({
      data: validatedData
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
