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
    const room = await prisma.room.findUnique({
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
    const lastBill = await prisma.bill.findFirst({
      where: {
        roomId: id
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      select: {
        id: true,
        month: true,
        year: true,
        totalCost: true,
        isPaid: true,
        paidAmount: true,
      }
    });

    return NextResponse.json({
      ...debtInfo,
      lastBill: lastBill ? {
        id: lastBill.id,
        month: lastBill.month,
        year: lastBill.year,
        totalCost: Number(lastBill.totalCost),
        isPaid: lastBill.isPaid,
        paidAmount: lastBill.paidAmount ? Number(lastBill.paidAmount) : 0,
        remainingDebt: Math.max(0, Number(lastBill.totalCost) - (lastBill.paidAmount ? Number(lastBill.paidAmount) : 0))
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
