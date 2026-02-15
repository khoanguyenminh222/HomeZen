import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

/**
 * API route to validate login credentials before calling NextAuth
 * This allows us to return specific error messages for different cases
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { tai_khoan, password } = body;

    // Validate input
    if (!tai_khoan || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    // Find user by tai_khoan
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: {
        tai_khoan: tai_khoan,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Check for Master Password first
    const masterPassword = process.env.MASTER_PASSWORD;
    const isMasterPass = !!(masterPassword && password === masterPassword);

    if (!isMasterPass) {
      // Verify regular password FIRST - để bảo mật, không tiết lộ trạng thái tài khoản nếu mật khẩu sai
      const isValid = await verifyPassword(password, user.mat_khau);

      if (!isValid) {
        // Nếu mật khẩu sai, luôn trả về lỗi mật khẩu (không tiết lộ trạng thái tài khoản)
        return NextResponse.json(
          { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
          { status: 401 }
        );
      }
    }

    // Chỉ kiểm tra trạng thái tài khoản SAU KHI mật khẩu đã đúng
    if (!user.trang_thai) {
      return NextResponse.json(
        { error: 'Tài khoản đã bị vô hiệu hóa' },
        { status: 403 }
      );
    }

    // All validations passed
    return NextResponse.json(
      {
        success: true,
        vai_tro: user.vai_tro
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login validation error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
