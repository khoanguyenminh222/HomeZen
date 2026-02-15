import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { propertyInfoSchema } from '@/lib/validations/propertyInfo';

/**
 * GET /api/settings/property
 * Lấy thông tin nhà trọ của user hiện tại
 * Validates: Requirements 4.1, 4.8
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lấy thông tin nhà trọ của user hiện tại
    const propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.findUnique({
      where: { nguoi_dung_id: session.user.id }
    });

    if (!propertyInfo) {
      return NextResponse.json(
        { data: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { data: propertyInfo },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching property info:', error);
    return NextResponse.json(
      { error: 'Không thể lấy thông tin nhà trọ. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/property
 * Tạo hoặc cập nhật thông tin nhà trọ của user hiện tại
 * Validates: Requirements 4.1-4.8
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input với Zod
    const validationResult = propertyInfoSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Kiểm tra xem đã có thông tin nhà trọ chưa
    const existingPropertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.findUnique({
      where: { nguoi_dung_id: session.user.id }
    });

    let propertyInfo;
    if (existingPropertyInfo) {
      // Cập nhật thông tin hiện tại
      propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.update({
        where: { id: existingPropertyInfo.id },
        data: {
          ten: data.ten,
          dia_chi: data.dia_chi,
          dien_thoai: data.dien_thoai,
          ten_chu_nha: data.ten_chu_nha,
          email: data.email || null,
          logo_url: data.logo_url || null,
          max_dong_ho_dien: data.max_dong_ho_dien,
          max_dong_ho_nuoc: data.max_dong_ho_nuoc,
        },
      });
    } else {
      // Tạo mới thông tin nhà trọ cho user hiện tại
      propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.create({
        data: {
          nguoi_dung_id: session.user.id,
          ten: data.ten,
          dia_chi: data.dia_chi,
          dien_thoai: data.dien_thoai,
          ten_chu_nha: data.ten_chu_nha,
          email: data.email || null,
          logo_url: data.logo_url || null,
          max_dong_ho_dien: data.max_dong_ho_dien,
          max_dong_ho_nuoc: data.max_dong_ho_nuoc,
        },
      });
    }

    return NextResponse.json(
      {
        data: propertyInfo,
        message: 'Lưu thông tin nhà trọ thành công'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving property info:', error);

    // Handle unique constraint error (user already has propertyInfo)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User đã có thông tin property. Vui lòng sử dụng PATCH để cập nhật.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Không thể lưu thông tin nhà trọ. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
