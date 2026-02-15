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

    // Kiểm tra người ở có tồn tại và thuộc về tenant này không
    const existingOccupant = await prisma.tNT_NGUOI_O.findFirst({
      where: {
        id: occupantId,
        nguoi_thue_id: id
      }
    });

    if (!existingOccupant) {
      return NextResponse.json(
        { error: 'Không tìm thấy người ở' },
        { status: 404 }
      );
    }

    // Validate request body
    const validatedResult = updateOccupantSchema.safeParse(body);
    if (!validatedResult.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: validatedResult.error.errors
        },
        { status: 400 }
      );
    }

    const validatedData = validatedResult.data;

    // Kiểm tra CMND/CCCD trùng (nếu có thay đổi)
    if (validatedData.can_cuoc && validatedData.can_cuoc !== existingOccupant.can_cuoc) {
      const idCardExists = await prisma.tNT_NGUOI_O.findFirst({
        where: {
          can_cuoc: validatedData.can_cuoc,
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
    const updatedOccupant = await prisma.tNT_NGUOI_O.update({
      where: { id: occupantId },
      data: {
        ...(validatedData.ho_ten && { ho_ten: validatedData.ho_ten }),
        ...(validatedData.can_cuoc !== undefined && { can_cuoc: validatedData.can_cuoc || null }),
        ...(validatedData.ngay_sinh !== undefined && { ngay_sinh: validatedData.ngay_sinh }),
        ...(validatedData.que_quan !== undefined && { que_quan: validatedData.que_quan || null }),
        ...(validatedData.moi_quan_he !== undefined && { moi_quan_he: validatedData.moi_quan_he || null }),
        ...(validatedData.loai_cu_tru && { loai_cu_tru: validatedData.loai_cu_tru }),
        // Thông tin bổ sung
        ...(validatedData.dien_thoai !== undefined && { dien_thoai: validatedData.dien_thoai || null }),
        ...(validatedData.gioi_tinh !== undefined && { gioi_tinh: validatedData.gioi_tinh || null }),
        ...(validatedData.nghe_nghiep !== undefined && { nghe_nghiep: validatedData.nghe_nghiep || null }),
        ...(validatedData.dan_toc !== undefined && { dan_toc: validatedData.dan_toc || null }),
        ...(validatedData.quoc_tich !== undefined && { quoc_tich: validatedData.quoc_tich || null }),
        ...(validatedData.dia_chi_thuong_tru !== undefined && { dia_chi_thuong_tru: validatedData.dia_chi_thuong_tru || null }),
        ...(validatedData.dia_chi_tam_tru !== undefined && { dia_chi_tam_tru: validatedData.dia_chi_tam_tru || null }),
        ...(validatedData.so_the_bao_hiem !== undefined && { so_the_bao_hiem: validatedData.so_the_bao_hiem || null }),
        ...(validatedData.ngay_cap !== undefined && { ngay_cap: validatedData.ngay_cap }),
        ...(validatedData.noi_cap !== undefined && { noi_cap: validatedData.noi_cap || null }),
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
    const occupant = await prisma.tNT_NGUOI_O.findFirst({
      where: {
        id: occupantId,
        nguoi_thue_id: id
      }
    });

    if (!occupant) {
      return NextResponse.json(
        { error: 'Không tìm thấy người ở' },
        { status: 404 }
      );
    }

    // Xóa người ở
    await prisma.tNT_NGUOI_O.delete({
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