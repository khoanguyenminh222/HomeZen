import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createBillSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';

// GET /api/bills - Danh sách hóa đơn (với filters)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : null;
    const isPaid = searchParams.get('isPaid') === 'true' ? true : searchParams.get('isPaid') === 'false' ? false : null;

    // Xây dựng filter
    const where = {};
    if (roomId) where.roomId = roomId;
    if (month) where.month = month;
    if (year) where.year = year;
    if (isPaid !== null) where.isPaid = isPaid;

    const bills = await prisma.bill.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        billFees: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách hóa đơn' },
      { status: 500 }
    );
  }
}

// POST /api/bills - Tạo hóa đơn mới
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBillSchema.parse(body);

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId },
      include: {
        tenant: {
          include: {
            occupants: true,
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Kiểm tra hóa đơn đã tồn tại chưa
    const existingBill = await prisma.bill.findUnique({
      where: {
        roomId_month_year: {
          roomId: validatedData.roomId,
          month: validatedData.month,
          year: validatedData.year,
        }
      }
    });

    if (existingBill) {
      return NextResponse.json(
        { error: `Hóa đơn tháng ${validatedData.month}/${validatedData.year} đã tồn tại cho phòng này` },
        { status: 400 }
      );
    }

    // Lấy PropertyInfo để có max meter chung
    const propertyInfo = await prisma.propertyInfo.findFirst();
    if (!propertyInfo) {
      return NextResponse.json(
        { error: 'Chưa cấu hình thông tin nhà trọ' },
        { status: 400 }
      );
    }

    // Lấy utility rate (riêng hoặc chung)
    const utilityRate = await getUtilityRateForRoom(validatedData.roomId);

    // Lấy các phí phát sinh từ RoomFee (phí được gán cho phòng)
    const roomFees = await prisma.roomFee.findMany({
      where: {
        roomId: validatedData.roomId,
        isActive: true,
      },
      include: {
        feeType: true,
      }
    });

    // Chuyển RoomFee thành BillFee format
    const billFees = roomFees.map(roomFee => ({
      name: roomFee.feeType.name,
      amount: roomFee.amount,
      feeTypeId: roomFee.feeTypeId,
    }));

    // Tính số người ở
    const occupantCount = room.tenant 
      ? 1 + (room.tenant.occupants?.length || 0) 
      : 1;

    // Tính toán hóa đơn
    const calculation = await calculateBill({
      roomId: validatedData.roomId,
      oldElectricReading: validatedData.oldElectricReading,
      newElectricReading: validatedData.newElectricReading,
      oldWaterReading: validatedData.oldWaterReading,
      newWaterReading: validatedData.newWaterReading,
      room,
      propertyInfo,
      utilityRate,
      tieredRates: utilityRate.tieredRates || [],
      occupantCount,
      billFees,
    });

    // Tạo hóa đơn
    const bill = await prisma.bill.create({
      data: {
        roomId: validatedData.roomId,
        month: validatedData.month,
        year: validatedData.year,
        oldElectricReading: validatedData.oldElectricReading,
        newElectricReading: validatedData.newElectricReading,
        electricityUsage: calculation.electricityUsage,
        electricityRollover: calculation.electricityRollover,
        oldWaterReading: validatedData.oldWaterReading,
        newWaterReading: validatedData.newWaterReading,
        waterUsage: calculation.waterUsage,
        waterRollover: calculation.waterRollover,
        electricMeterPhotoUrl: validatedData.electricMeterPhotoUrl,
        waterMeterPhotoUrl: validatedData.waterMeterPhotoUrl,
        roomPrice: calculation.roomPrice,
        electricityCost: calculation.electricityCost,
        waterCost: calculation.waterCost,
        totalCost: calculation.totalCost,
        totalCostText: calculation.totalCostText,
        notes: validatedData.notes,
        billFees: {
          create: billFees.map(fee => ({
            name: fee.name,
            amount: fee.amount,
            feeTypeId: fee.feeTypeId,
          }))
        }
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

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error creating bill:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message?.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Hóa đơn đã tồn tại cho phòng này trong tháng/năm này' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Lỗi khi tạo hóa đơn' },
      { status: 500 }
    );
  }
}
