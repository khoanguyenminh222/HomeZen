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
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Verify password FIRST - để bảo mật, không tiết lộ trạng thái tài khoản nếu mật khẩu sai
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      // Nếu mật khẩu sai, luôn trả về lỗi mật khẩu (không tiết lộ trạng thái tài khoản)
      return NextResponse.json(
        { error: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Chỉ kiểm tra trạng thái tài khoản SAU KHI mật khẩu đã đúng
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Tài khoản đã bị vô hiệu hóa' },
        { status: 403 }
      );
    }

    // All validations passed
    return NextResponse.json(
      { 
        success: true,
        role: user.role 
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
