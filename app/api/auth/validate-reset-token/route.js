import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * API route để xác thực token reset password
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token không được cung cấp' },
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
        { valid: false, error: 'Token không hợp lệ' },
        { status: 200 }
      );
    }

    // Kiểm tra token đã được sử dụng chưa
    if (resetToken.used) {
      return NextResponse.json(
        { valid: false, error: 'Token đã được sử dụng' },
        { status: 200 }
      );
    }

    // Kiểm tra token đã hết hạn chưa
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'Token đã hết hạn' },
        { status: 200 }
      );
    }

    // Kiểm tra user có active không
    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Tài khoản đã bị vô hiệu hóa' },
        { status: 200 }
      );
    }

    // Token hợp lệ
    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate reset token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Đã xảy ra lỗi khi xác thực token' },
      { status: 500 }
    );
  }
}
