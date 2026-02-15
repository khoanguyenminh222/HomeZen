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
    const tenant = await prisma.tNT_NGUOI_THUE_CHINH.findUnique({
      where: { id }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Không tìm thấy người thuê' },
        { status: 404 }
      );
    }

    // Kiểm tra CMND/CCCD trùng (nếu có)
    if (validatedData.can_cuoc) {
      const existingOccupant = await prisma.tNT_NGUOI_O.findFirst({
        where: { can_cuoc: validatedData.can_cuoc }
      });

      if (existingOccupant) {
        return NextResponse.json(
          { error: 'CMND/CCCD đã được sử dụng bởi người ở khác' },
          { status: 400 }
        );
      }
    }

    // Tạo người ở mới
    const occupant = await prisma.tNT_NGUOI_O.create({
      data: {
        ho_ten: validatedData.ho_ten,
        can_cuoc: validatedData.can_cuoc || null,
        ngay_sinh: validatedData.ngay_sinh || null,
        que_quan: validatedData.que_quan || null,
        moi_quan_he: validatedData.moi_quan_he || null,
        loai_cu_tru: validatedData.loai_cu_tru,
        nguoi_thue_id: id,
        // Thông tin bổ sung
        dien_thoai: validatedData.dien_thoai || null,
        gioi_tinh: validatedData.gioi_tinh || null,
        nghe_nghiep: validatedData.nghe_nghiep || null,
        dan_toc: validatedData.dan_toc || null,
        quoc_tich: validatedData.quoc_tich || null,
        dia_chi_thuong_tru: validatedData.dia_chi_thuong_tru || null,
        dia_chi_tam_tru: validatedData.dia_chi_tam_tru || null,
        so_the_bao_hiem: validatedData.so_the_bao_hiem || null,
        ngay_cap: validatedData.ngay_cap || null,
        noi_cap: validatedData.noi_cap || null,
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