import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

/**
 * API route để đặt lại mật khẩu với token
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mật khẩu mới' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Tìm token trong database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: {
        token: token,
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra token đã được sử dụng chưa
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token đã được sử dụng. Vui lòng yêu cầu đặt lại mật khẩu mới.' },
        { status: 400 }
      );
    }

    // Kiểm tra token đã hết hạn chưa
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.' },
        { status: 400 }
      );
    }

    // Kiểm tra user có active không
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { error: 'Tài khoản đã bị vô hiệu hóa' },
        { status: 403 }
      );
    }

    // Hash mật khẩu mới
    const hashedPassword = await hashPassword(password);

    // Cập nhật mật khẩu và đánh dấu token đã sử dụng (transaction)
    await prisma.$transaction([
      // Cập nhật mật khẩu
      prisma.user.update({
        where: {
          id: resetToken.user.id,
        },
        data: {
          password: hashedPassword,
        },
      }),
      // Đánh dấu token đã sử dụng
      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          used: true,
        },
      }),
    ]);

    return NextResponse.json(
      { 
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
