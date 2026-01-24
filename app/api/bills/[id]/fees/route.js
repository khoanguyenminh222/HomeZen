import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { addBillFeeSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';
import { BillHistoryService } from '@/lib/services/bill-history.service';

// POST /api/bills/[id]/fees - Thêm phí phát sinh vào hóa đơn
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: billId } = await params;
    const body = await request.json();
    const validatedData = addBillFeeSchema.parse(body);

    // Kiểm tra hóa đơn có tồn tại không
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        room: {
          include: {
            tenant: {
              include: {
                occupants: true,
              }
            }
          }
        },
        billFees: true,
      }
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Không cho phép thêm phí vào hóa đơn đã thanh toán
    if (bill.isPaid) {
      return NextResponse.json(
        { error: 'Không thể thêm phí vào hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Thêm phí phát sinh
    const billFee = await prisma.billFee.create({
      data: {
        billId,
        name: validatedData.name,
        amount: validatedData.amount,
        feeTypeId: validatedData.feeTypeId,
      }
    });

    // Tính toán lại tổng tiền hóa đơn
    const propertyInfo = await prisma.propertyInfo.findFirst();
    if (!propertyInfo) {
      return NextResponse.json(
        { error: 'Chưa cấu hình thông tin nhà trọ' },
        { status: 400 }
      );
    }

    const utilityRate = await getUtilityRateForRoom(bill.roomId);
    const occupantCount = bill.room.tenant 
      ? 1 + (bill.room.tenant.occupants?.length || 0) 
      : 1;

    // Lấy tất cả phí phát sinh (bao gồm phí vừa thêm)
    const allBillFees = await prisma.billFee.findMany({
      where: { billId }
    });

    const calculation = await calculateBill({
      roomId: bill.roomId,
      oldElectricReading: bill.oldElectricReading,
      newElectricReading: bill.newElectricReading,
      oldWaterReading: bill.oldWaterReading,
      newWaterReading: bill.newWaterReading,
      room: bill.room,
      propertyInfo,
      utilityRate,
      tieredRates: utilityRate.tieredRates || [],
      occupantCount,
      billFees: allBillFees,
    });

    // Cập nhật tổng tiền hóa đơn
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: {
        totalCost: calculation.totalCost,
        totalCostText: calculation.totalCostText,
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

    // Ghi lịch sử thêm phí
    const oldSnapshot = BillHistoryService.createBillSnapshot(bill);
    const newSnapshot = BillHistoryService.createBillSnapshot(updatedBill);
    
    await BillHistoryService.createHistory({
      billId: billId,
      action: 'FEE_ADD',
      changedBy: session.user.id,
      oldData: oldSnapshot,
      newData: newSnapshot,
      description: `Thêm phí phát sinh: ${validatedData.name} - ${validatedData.amount.toLocaleString('vi-VN')} VNĐ`,
    });

    return NextResponse.json(billFee, { status: 201 });
  } catch (error) {
    console.error('Error adding bill fee:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi thêm phí phát sinh' },
      { status: 500 }
    );
  }
}
