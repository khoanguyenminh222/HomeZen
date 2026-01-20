import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateBillSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';

// GET /api/bills/[id] - Chi tiết hóa đơn
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const bill = await prisma.bill.findUnique({
      where: { id },
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

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin hóa đơn' },
      { status: 500 }
    );
  }
}

// PUT /api/bills/[id] - Cập nhật hóa đơn
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Kiểm tra hóa đơn có tồn tại không
    const existingBill = await prisma.bill.findUnique({
      where: { id },
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

    if (!existingBill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Không cho phép sửa hóa đơn đã thanh toán
    if (existingBill.isPaid) {
      return NextResponse.json(
        { error: 'Không thể sửa hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Validate dữ liệu
    const validatedData = updateBillSchema.parse({ ...body, id });

    // Lấy thông tin cần thiết
    const room = existingBill.room;
    const propertyInfo = await prisma.propertyInfo.findFirst();
    if (!propertyInfo) {
      return NextResponse.json(
        { error: 'Chưa cấu hình thông tin nhà trọ' },
        { status: 400 }
      );
    }

    const utilityRate = await getUtilityRateForRoom(room.id);

    // Lấy các phí phát sinh hiện tại (giữ nguyên nếu không cập nhật)
    const currentBillFees = await prisma.billFee.findMany({
      where: { billId: id }
    });

    const billFees = currentBillFees.map(fee => ({
      name: fee.name,
      amount: fee.amount,
      feeTypeId: fee.feeTypeId,
    }));

    // Tính số người ở
    const occupantCount = room.tenant 
      ? 1 + (room.tenant.occupants?.length || 0) 
      : 1;

    // Tính toán lại hóa đơn
    const calculation = await calculateBill({
      roomId: room.id,
      oldElectricReading: validatedData.oldElectricReading ?? existingBill.oldElectricReading,
      newElectricReading: validatedData.newElectricReading ?? existingBill.newElectricReading,
      oldWaterReading: validatedData.oldWaterReading ?? existingBill.oldWaterReading,
      newWaterReading: validatedData.newWaterReading ?? existingBill.newWaterReading,
      room,
      propertyInfo,
      utilityRate,
      tieredRates: utilityRate.tieredRates || [],
      occupantCount,
      billFees,
    });

    // Cập nhật hóa đơn
    const bill = await prisma.bill.update({
      where: { id },
      data: {
        month: validatedData.month ?? existingBill.month,
        year: validatedData.year ?? existingBill.year,
        oldElectricReading: validatedData.oldElectricReading ?? existingBill.oldElectricReading,
        newElectricReading: validatedData.newElectricReading ?? existingBill.newElectricReading,
        electricityUsage: calculation.electricityUsage,
        electricityRollover: calculation.electricityRollover,
        oldWaterReading: validatedData.oldWaterReading ?? existingBill.oldWaterReading,
        newWaterReading: validatedData.newWaterReading ?? existingBill.newWaterReading,
        waterUsage: calculation.waterUsage,
        waterRollover: calculation.waterRollover,
        electricMeterPhotoUrl: validatedData.electricMeterPhotoUrl ?? existingBill.electricMeterPhotoUrl,
        waterMeterPhotoUrl: validatedData.waterMeterPhotoUrl ?? existingBill.waterMeterPhotoUrl,
        roomPrice: calculation.roomPrice,
        electricityCost: calculation.electricityCost,
        waterCost: calculation.waterCost,
        totalCost: calculation.totalCost,
        totalCostText: calculation.totalCostText,
        notes: validatedData.notes ?? existingBill.notes,
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

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Lỗi khi cập nhật hóa đơn' },
      { status: 500 }
    );
  }
}

// DELETE /api/bills/[id] - Xóa hóa đơn
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    // Không cho phép xóa hóa đơn đã thanh toán
    if (bill.isPaid) {
      return NextResponse.json(
        { error: 'Không thể xóa hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Xóa hóa đơn (BillFee sẽ tự động xóa do cascade)
    await prisma.bill.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Xóa hóa đơn thành công' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa hóa đơn' },
      { status: 500 }
    );
  }
}
