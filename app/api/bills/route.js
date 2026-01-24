import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createBillSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';
import { isSuperAdmin, validateResourceOwnership } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

// GET /api/bills - Danh sách hóa đơn (với filters)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : null;
    const isPaid = searchParams.get('isPaid');
    const isPartial = isPaid === 'partial';
    const status = searchParams.get('status'); // Hỗ trợ status=unpaid

    // Xây dựng filter
    const where = {};
    if (roomId) {
      where.roomId = roomId;
      
      // Validate property access for room if Property Owner
      if (!isSuperAdmin(session)) {
        const hasAccess = await validateResourceOwnership(session.user.id, roomId, 'room');
        if (!hasAccess) {
          logAuthorizationViolation(request, session, `No access to room ${roomId}`, roomId, 'room');
          return NextResponse.json(
            { error: 'Forbidden: No access to this room' },
            { status: 403 }
          );
        }
      }
    } else {
      // If no roomId specified, filter by userId for Property Owners
      if (!isSuperAdmin(session)) {
        // Filter trực tiếp theo userId (tối ưu hơn filter qua room.userId)
        where.userId = session.user.id;
      }
    }
    
    if (month) where.month = month;
    if (year) where.year = year;
    
    // Xử lý filter isPaid: 'true', 'false', 'partial', hoặc null
    // Nếu status=unpaid, không filter ở đây, sẽ filter sau để bao gồm cả thanh toán một phần
    if (status !== 'unpaid') {
      if (isPaid === 'true') {
        where.isPaid = true;
      } else if (isPaid === 'false') {
        where.isPaid = false;
      }
    }
    // Nếu là 'partial', không thêm filter vào where, sẽ filter sau

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

    // Filter theo trạng thái thanh toán
    let filteredBills = bills;
    if (status === 'unpaid' || isPaid === 'false') {
      // Filter hóa đơn chưa thanh toán (bao gồm cả thanh toán một phần)
      filteredBills = bills.filter(bill => {
        const totalCost = Number(bill.totalCost || 0);
        const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
        const remainingDebt = totalCost - paidAmount;
        
        // Chưa thanh toán hoặc thanh toán một phần (còn nợ)
        return remainingDebt > 0;
      });
    } else if (isPartial) {
      // Filter thanh toán một phần
      filteredBills = bills.filter(bill => {
        const totalCost = Number(bill.totalCost || 0);
        const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
        return bill.isPaid && paidAmount > 0 && paidAmount < totalCost;
      });
    } else if (isPaid === 'true') {
      // Filter chỉ thanh toán đầy đủ (không bao gồm thanh toán một phần)
      filteredBills = bills.filter(bill => {
        if (!bill.isPaid) return false;
        const totalCost = Number(bill.totalCost || 0);
        // Nếu không có paidAmount (null), coi là đã thanh toán đầy đủ (hóa đơn cũ)
        if (bill.paidAmount === null || bill.paidAmount === undefined) {
          return true;
        }
        const paidAmount = Number(bill.paidAmount);
        // Đã thanh toán đầy đủ: paidAmount >= totalCost
        return paidAmount >= totalCost;
      });
    }

    return NextResponse.json(filteredBills);
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
      logUnauthorizedAccess(request, null, 'No session found');
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

    // Validate property access for room
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, validatedData.roomId, 'room');
      if (!hasAccess) {
        logAuthorizationViolation(request, session, `No access to room ${validatedData.roomId}`, validatedData.roomId, 'room');
        return NextResponse.json(
          { error: 'Forbidden: No access to this room' },
          { status: 403 }
        );
      }
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
    const user = await prisma.user.findUnique({
      where: { id: room.userId },
      include: {
        propertyInfo: true
      }
    });

    if (!user || !user.propertyInfo) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin property' },
        { status: 400 }
      );
    }

    // Create propertyInfo-like object for compatibility
    const propertyInfo = {
      maxElectricMeter: room.maxElectricMeter || user.propertyInfo.maxElectricMeter || 999999,
      maxWaterMeter: room.maxWaterMeter || user.propertyInfo.maxWaterMeter || 99999,
    };

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
        userId: room.userId, // Lưu userId từ room để tối ưu query
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
        // Lưu thông tin tenant (snapshot tại thời điểm tạo hóa đơn)
        tenantName: room.tenant?.fullName || null,
        tenantPhone: room.tenant?.phone || null,
        tenantDateOfBirth: room.tenant?.dateOfBirth || null,
        tenantIdCard: room.tenant?.idCard || null,
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
