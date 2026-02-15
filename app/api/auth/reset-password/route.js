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
    const resetToken = await prisma.uSR_TOKEN_DAT_LAI_MAT_KHAU.findUnique({
      where: {
        token: token,
      },
      include: {
        nguoi_dung: {
          select: {
            id: true,
            trang_thai: true,
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
    if (resetToken.da_su_dung) {
      return NextResponse.json(
        { error: 'Token đã được sử dụng. Vui lòng yêu cầu đặt lại mật khẩu mới.' },
        { status: 400 }
      );
    }

    // Kiểm tra token đã hết hạn chưa
    if (new Date() > resetToken.het_han_luc) {
      return NextResponse.json(
        { error: 'Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.' },
        { status: 400 }
      );
    }

    // Kiểm tra user có active không
    if (!resetToken.nguoi_dung.trang_thai) {
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
      prisma.uSR_NGUOI_DUNG.update({
        where: {
          id: resetToken.nguoi_dung.id,
        },
        data: {
          mat_khau: hashedPassword,
        },
      }),
      // Đánh dấu token đã sử dụng
      prisma.uSR_TOKEN_DAT_LAI_MAT_KHAU.update({
        where: {
          id: resetToken.id,
        },
        data: {
          da_su_dung: true,
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
