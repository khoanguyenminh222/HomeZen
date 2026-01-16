import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { propertyInfoSchema } from '@/lib/validations/propertyInfo';

/**
 * GET /api/settings/property
 * Lấy thông tin nhà trọ
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

    // Lấy thông tin nhà trọ (chỉ có 1 bản ghi)
    const propertyInfo = await prisma.propertyInfo.findFirst();

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
 * Tạo hoặc cập nhật thông tin nhà trọ
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
    const existingPropertyInfo = await prisma.propertyInfo.findFirst();

    let propertyInfo;
    if (existingPropertyInfo) {
      // Cập nhật thông tin hiện tại
      propertyInfo = await prisma.propertyInfo.update({
        where: { id: existingPropertyInfo.id },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          ownerName: data.ownerName,
          email: data.email || null,
          logoUrl: data.logoUrl || null,
        },
      });
    } else {
      // Tạo mới thông tin nhà trọ
      propertyInfo = await prisma.propertyInfo.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          ownerName: data.ownerName,
          email: data.email || null,
          logoUrl: data.logoUrl || null,
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
    return NextResponse.json(
      { error: 'Không thể lưu thông tin nhà trọ. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
