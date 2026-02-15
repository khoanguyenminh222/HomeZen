import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getRoomDebtInfo } from '@/lib/debt/getRoomDebtInfo';
import prisma from '@/lib/prisma';

/**
 * GET /api/rooms/[id]/debt - Lấy thông tin nợ của phòng
 * Requirements: 18.2, 18.3, 18.5
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Lấy thông tin nợ
    const debtInfo = await getRoomDebtInfo(id);

    // Lấy hóa đơn cuối cùng (theo thời gian) để tính toán khi trừ tiền cọc
    const lastBill = await prisma.bIL_HOA_DON.findFirst({
      where: {
        phong_id: id
      },
      orderBy: [
        { nam: 'desc' },
        { thang: 'desc' }
      ],
      select: {
        id: true,
        thang: true,
        nam: true,
        tong_tien: true,
        da_thanh_toan: true,
        so_tien_da_tra: true,
      }
    });

    return NextResponse.json({
      ...debtInfo,
      lastBill: lastBill ? {
        id: lastBill.id,
        thang: lastBill.thang,
        nam: lastBill.nam,
        tong_tien: Number(lastBill.tong_tien),
        da_thanh_toan: lastBill.da_thanh_toan,
        so_tien_da_tra: lastBill.so_tien_da_tra ? Number(lastBill.so_tien_da_tra) : 0,
        remainingDebt: Math.max(0, Number(lastBill.tong_tien) - (lastBill.so_tien_da_tra ? Number(lastBill.so_tien_da_tra) : 0))
      } : null
    });
  } catch (error) {
    console.error('Error fetching room debt info:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin nợ' },
      { status: 500 }
    );
  }
}
