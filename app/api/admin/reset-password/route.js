import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { z } from 'zod';

/**
 * POST /api/admin/reset-password
 * Reset password for a user (Super Admin only)
 */
const resetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

async function postHandler(request) {
  try {
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { userId, newPassword } = validationResult.data;

    // Check if user exists
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId },
      select: { id: true, tai_khoan: true, vai_tro: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.uSR_NGUOI_DUNG.update({
      where: { id: userId },
      data: {
        mat_khau: hashedPassword,
      }
    });

    return NextResponse.json(
      {
        message: `Đã reset mật khẩu thành công cho user: ${user.tai_khoan}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Không thể reset mật khẩu. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

export const POST = requireSuperAdmin(postHandler);
