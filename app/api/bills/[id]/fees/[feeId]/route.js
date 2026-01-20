import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateBillFeeSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';

// PUT /api/bills/[id]/fees/[feeId] - Cập nhật phí phát sinh
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: billId, feeId } = await params;
    const body = await request.json();
    const validatedData = updateBillFeeSchema.parse(body);

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
        }
      }
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Không cho phép sửa phí trong hóa đơn đã thanh toán
    if (bill.isPaid) {
      return NextResponse.json(
        { error: 'Không thể sửa phí trong hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Kiểm tra phí có tồn tại không
    const billFee = await prisma.billFee.findUnique({
      where: { id: feeId }
    });

    if (!billFee || billFee.billId !== billId) {
      return NextResponse.json(
        { error: 'Không tìm thấy phí phát sinh' },
        { status: 404 }
      );
    }

    // Cập nhật phí
    const updatedFee = await prisma.billFee.update({
      where: { id: feeId },
      data: {
        name: validatedData.name ?? billFee.name,
        amount: validatedData.amount ?? billFee.amount,
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
    await prisma.bill.update({
      where: { id: billId },
      data: {
        totalCost: calculation.totalCost,
        totalCostText: calculation.totalCostText,
      }
    });

    return NextResponse.json(updatedFee);
  } catch (error) {
    console.error('Error updating bill fee:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật phí phát sinh' },
      { status: 500 }
    );
  }
}

// DELETE /api/bills/[id]/fees/[feeId] - Xóa phí phát sinh
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: billId, feeId } = await params;

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
        }
      }
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Không cho phép xóa phí trong hóa đơn đã thanh toán
    if (bill.isPaid) {
      return NextResponse.json(
        { error: 'Không thể xóa phí trong hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Kiểm tra phí có tồn tại không
    const billFee = await prisma.billFee.findUnique({
      where: { id: feeId }
    });

    if (!billFee || billFee.billId !== billId) {
      return NextResponse.json(
        { error: 'Không tìm thấy phí phát sinh' },
        { status: 404 }
      );
    }

    // Xóa phí
    await prisma.billFee.delete({
      where: { id: feeId }
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
    await prisma.bill.update({
      where: { id: billId },
      data: {
        totalCost: calculation.totalCost,
        totalCostText: calculation.totalCostText,
      }
    });

    return NextResponse.json({ message: 'Xóa phí phát sinh thành công' });
  } catch (error) {
    console.error('Error deleting bill fee:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa phí phát sinh' },
      { status: 500 }
    );
  }
}
