import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateBillStatusSchema } from '@/lib/validations/bill';

// PATCH /api/bills/[id]/status - Cập nhật trạng thái thanh toán
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBillStatusSchema.parse(body);

    // Kiểm tra hóa đơn có tồn tại không
    const bill = await prisma.bill.findUnique({
      where: { id }
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Cập nhật trạng thái
    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        isPaid: validatedData.isPaid,
        paidDate: validatedData.isPaid 
          ? (validatedData.paidDate ? new Date(validatedData.paidDate) : new Date())
          : null,
      },
      include: {
        room: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        billFees: true,
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Error updating bill status:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật trạng thái hóa đơn' },
      { status: 500 }
    );
  }
}
