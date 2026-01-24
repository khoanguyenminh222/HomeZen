import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateOccupantSchema } from '@/lib/validations/tenant';

// PUT /api/tenants/[id]/occupants/[occupantId] - Cập nhật người ở
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, occupantId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateOccupantSchema.parse(body);

    // Kiểm tra người ở có tồn tại và thuộc về tenant này không
    const existingOccupant = await prisma.occupant.findFirst({
      where: {
        id: occupantId,
        tenantId: id
      }
    });

    if (!existingOccupant) {
      return NextResponse.json(
        { error: 'Không tìm thấy người ở' },
        { status: 404 }
      );
    }

    // Kiểm tra CMND/CCCD trùng (nếu có thay đổi)
    if (validatedData.idCard && validatedData.idCard !== existingOccupant.idCard) {
      const idCardExists = await prisma.occupant.findFirst({
        where: {
          idCard: validatedData.idCard,
          id: { not: occupantId }
        }
      });

      if (idCardExists) {
        return NextResponse.json(
          { error: 'CMND/CCCD đã được sử dụng bởi người ở khác' },
          { status: 400 }
        );
      }
    }

    // Cập nhật người ở
    const updatedOccupant = await prisma.occupant.update({
      where: { id: occupantId },
      data: {
        ...(validatedData.fullName && { fullName: validatedData.fullName }),
        ...(validatedData.idCard !== undefined && { idCard: validatedData.idCard || null }),
        ...(validatedData.dateOfBirth !== undefined && { dateOfBirth: validatedData.dateOfBirth }),
        ...(validatedData.hometown !== undefined && { hometown: validatedData.hometown || null }),
        ...(validatedData.relationship !== undefined && { relationship: validatedData.relationship || null }),
        ...(validatedData.residenceType && { residenceType: validatedData.residenceType }),
        // Thông tin bổ sung
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
        ...(validatedData.gender !== undefined && { gender: validatedData.gender || null }),
        ...(validatedData.occupation !== undefined && { occupation: validatedData.occupation || null }),
        ...(validatedData.ethnicity !== undefined && { ethnicity: validatedData.ethnicity || null }),
        ...(validatedData.nationality !== undefined && { nationality: validatedData.nationality || null }),
        ...(validatedData.permanentAddress !== undefined && { permanentAddress: validatedData.permanentAddress || null }),
        ...(validatedData.temporaryAddress !== undefined && { temporaryAddress: validatedData.temporaryAddress || null }),
        ...(validatedData.insuranceCardNumber !== undefined && { insuranceCardNumber: validatedData.insuranceCardNumber || null }),
        ...(validatedData.issueDate !== undefined && { issueDate: validatedData.issueDate }),
        ...(validatedData.placeOfIssue !== undefined && { placeOfIssue: validatedData.placeOfIssue || null }),
      }
    });

    return NextResponse.json(updatedOccupant);
  } catch (error) {
    console.error('Error updating occupant:', error);

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
      { error: 'Lỗi khi cập nhật người ở' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id]/occupants/[occupantId] - Xóa người ở
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, occupantId } = await params;

    // Kiểm tra người ở có tồn tại và thuộc về tenant này không
    const occupant = await prisma.occupant.findFirst({
      where: {
        id: occupantId,
        tenantId: id
      }
    });

    if (!occupant) {
      return NextResponse.json(
        { error: 'Không tìm thấy người ở' },
        { status: 404 }
      );
    }

    // Xóa người ở
    await prisma.occupant.delete({
      where: { id: occupantId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting occupant:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa người ở' },
      { status: 500 }
    );
  }
}