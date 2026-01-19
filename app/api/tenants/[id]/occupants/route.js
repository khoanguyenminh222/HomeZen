import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createOccupantSchema } from '@/lib/validations/tenant';

// POST /api/tenants/[id]/occupants - Thêm người ở
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createOccupantSchema.parse(body);

    // Kiểm tra người thuê có tồn tại không
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Không tìm thấy người thuê' },
        { status: 404 }
      );
    }

    // Kiểm tra CMND/CCCD trùng (nếu có)
    if (validatedData.idCard) {
      const existingOccupant = await prisma.occupant.findFirst({
        where: { idCard: validatedData.idCard }
      });

      if (existingOccupant) {
        return NextResponse.json(
          { error: 'CMND/CCCD đã được sử dụng bởi người ở khác' },
          { status: 400 }
        );
      }
    }

    // Tạo người ở mới
    const occupant = await prisma.occupant.create({
      data: {
        fullName: validatedData.fullName,
        idCard: validatedData.idCard || null,
        dateOfBirth: validatedData.dateOfBirth || null,
        hometown: validatedData.hometown || null,
        relationship: validatedData.relationship || null,
        residenceType: validatedData.residenceType,
        tenantId: id
      }
    });

    return NextResponse.json(occupant, { status: 201 });
  } catch (error) {
    console.error('Error creating occupant:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi thêm người ở' },
      { status: 500 }
    );
  }
}