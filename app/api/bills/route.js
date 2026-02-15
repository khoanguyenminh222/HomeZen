import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createBillSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';
import { isSuperAdmin, validateResourceOwnership } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';
import { BillHistoryService } from '@/lib/services/bill-history.service';

// GET /api/bills - Danh sách hóa đơn (với filters)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phong_id = searchParams.get('phong_id') || searchParams.get('roomId');
    const thang = searchParams.get('thang') ? parseInt(searchParams.get('thang')) : (searchParams.get('month') ? parseInt(searchParams.get('month')) : null);
    const nam = searchParams.get('nam') ? parseInt(searchParams.get('nam')) : (searchParams.get('year') ? parseInt(searchParams.get('year')) : null);
    const isPaid = searchParams.get('da_thanh_toan') || searchParams.get('isPaid');
    const isPartial = isPaid === 'partial';
    const status = searchParams.get('trang_thai') || searchParams.get('status'); // Hỗ trợ status=unpaid

    // Xây dựng filter
    const where = {};
    if (phong_id) {
      where.phong_id = phong_id;

      // Validate property access for room if Property Owner
      if (!isSuperAdmin(session)) {
        const hasAccess = await validateResourceOwnership(session.user.id, phong_id, 'room');
        if (!hasAccess) {
          logAuthorizationViolation(request, session, `No access to room ${phong_id}`, phong_id, 'room');
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
        where.nguoi_dung_id = session.user.id;
      }
    }

    if (thang) where.thang = thang;
    if (nam) where.nam = nam;

    // Xử lý filter isPaid: 'true', 'false', 'partial', hoặc null
    // Nếu status=unpaid, không filter ở đây, sẽ filter sau để bao gồm cả thanh toán một phần
    if (status !== 'unpaid') {
      if (isPaid === 'true') {
        where.da_thanh_toan = true;
      } else if (isPaid === 'false') {
        where.da_thanh_toan = false;
      }
    }
    // Nếu là 'partial', không thêm filter vào where, sẽ filter sau

    const bills = await prisma.bIL_HOA_DON.findMany({
      where,
      include: {
        phong: {
          select: {
            id: true,
            ma_phong: true,
            ten_phong: true,
          }
        },
        phi_hoa_don: true,
      },
      orderBy: [
        { nam: 'desc' },
        { thang: 'desc' },
        { ngay_tao: 'desc' },
      ],
    });

    // Filter theo trạng thái thanh toán
    let filteredBills = bills;
    if (status === 'unpaid' || isPaid === 'false') {
      // Filter hóa đơn chưa thanh toán (bao gồm cả thanh toán một phần)
      filteredBills = bills.filter(bill => {
        const totalCost = Number(bill.tong_tien || 0);
        const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
        const remainingDebt = totalCost - paidAmount;

        // Chưa thanh toán hoặc thanh toán một phần (còn nợ)
        return remainingDebt > 0;
      });
    } else if (isPartial) {
      // Filter thanh toán một phần
      filteredBills = bills.filter(bill => {
        const totalCost = Number(bill.tong_tien || 0);
        const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
        return bill.da_thanh_toan && paidAmount > 0 && paidAmount < totalCost;
      });
    } else if (isPaid === 'true') {
      // Filter chỉ thanh toán đầy đủ (không bao gồm thanh toán một phần)
      filteredBills = bills.filter(bill => {
        if (!bill.da_thanh_toan) return false;
        const totalCost = Number(bill.tong_tien || 0);
        // Nếu không có paidAmount (null), coi là đã thanh toán đầy đủ (hóa đơn cũ)
        if (bill.so_tien_da_tra === null || bill.so_tien_da_tra === undefined) {
          return true;
        }
        const paidAmount = Number(bill.so_tien_da_tra);
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
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: validatedData.phong_id },
      include: {
        nguoi_thue: {
          include: {
            nguoi_o: true,
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
      const hasAccess = await validateResourceOwnership(session.user.id, validatedData.phong_id, 'room');
      if (!hasAccess) {
        logAuthorizationViolation(request, session, `No access to room ${validatedData.phong_id}`, validatedData.phong_id, 'room');
        return NextResponse.json(
          { error: 'Forbidden: No access to this room' },
          { status: 403 }
        );
      }
    }

    // Kiểm tra hóa đơn đã tồn tại chưa
    const existingBill = await prisma.bIL_HOA_DON.findUnique({
      where: {
        phong_id_thang_nam: {
          phong_id: validatedData.phong_id,
          thang: validatedData.thang,
          nam: validatedData.nam,
        }
      }
    });

    if (existingBill) {
      return NextResponse.json(
        { error: `Hóa đơn tháng ${validatedData.thang}/${validatedData.nam} đã tồn tại cho phòng này` },
        { status: 400 }
      );
    }

    // Lấy PropertyInfo để có max meter chung
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: room.nguoi_dung_id },
      include: {
        thong_tin_nha_tro: true
      }
    });

    if (!user || !user.thong_tin_nha_tro) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin property' },
        { status: 400 }
      );
    }

    // Create propertyInfo-like object for compatibility
    const propertyInfo = {
      max_dong_ho_dien: room.max_dong_ho_dien || user.thong_tin_nha_tro.max_dong_ho_dien || 999999,
      max_dong_ho_nuoc: room.max_dong_ho_nuoc || user.thong_tin_nha_tro.max_dong_ho_nuoc || 99999,
    };

    // Lấy utility rate (riêng hoặc chung)
    const utilityRate = await getUtilityRateForRoom(validatedData.phong_id);

    // Lấy các phí phát sinh từ RoomFee (phí được gán cho phòng)
    const roomFees = await prisma.bIL_PHI_PHONG.findMany({
      where: {
        phong_id: validatedData.phong_id,
        trang_thai: true,
      },
      include: {
        loai_phi: true,
      }
    });

    // Chuyển RoomFee thành BillFee format
    const billFees = roomFees.map(roomFee => ({
      ten_phi: roomFee.loai_phi.ten_phi,
      so_tien: roomFee.so_tien,
      loai_phi_id: roomFee.loai_phi_id,
    }));

    // Tính số người ở
    const occupantCount = room.nguoi_thue
      ? 1 + (room.nguoi_thue.nguoi_o?.length || 0)
      : 1;

    // Tính toán hóa đơn
    const calculation = await calculateBill({
      phong_id: validatedData.phong_id,
      chi_so_dien_cu: validatedData.chi_so_dien_cu,
      chi_so_dien_moi: validatedData.chi_so_dien_moi,
      chi_so_nuoc_cu: validatedData.chi_so_nuoc_cu,
      chi_so_nuoc_moi: validatedData.chi_so_nuoc_moi,
      room,
      propertyInfo,
      utilityRate,
      bac_thang_gia: utilityRate.bac_thang_gia || [],
      occupantCount,
      billFees,
    });

    // Tạo hóa đơn
    const bill = await prisma.bIL_HOA_DON.create({
      data: {
        phong_id: validatedData.phong_id,
        nguoi_dung_id: room.nguoi_dung_id, // Lưu userId từ room để tối ưu query
        thang: validatedData.thang,
        nam: validatedData.nam,
        chi_so_dien_cu: validatedData.chi_so_dien_cu,
        chi_so_dien_moi: validatedData.chi_so_dien_moi,
        tieu_thu_dien: calculation.electricityUsage,
        dien_vuot_nguong: calculation.electricityRollover,
        chi_so_nuoc_cu: validatedData.chi_so_nuoc_cu,
        chi_so_nuoc_moi: validatedData.chi_so_nuoc_moi,
        tieu_thu_nuoc: calculation.waterUsage,
        nuoc_vuot_nguong: calculation.waterRollover,
        anh_dong_ho_dien: validatedData.url_anh_dong_ho_dien,
        anh_dong_ho_nuoc: validatedData.url_anh_dong_ho_nuoc,
        gia_phong: calculation.roomPrice,
        tien_dien: calculation.electricityCost,
        tien_nuoc: calculation.waterCost,
        tong_tien: calculation.totalCost,
        tong_tien_chu: calculation.totalCostText,
        ghi_chu: validatedData.ghi_chu,
        // Lưu thông tin tenant (snapshot tại thời điểm tạo hóa đơn)
        ten_nguoi_thue: room.nguoi_thue?.ho_ten || null,
        sdt_nguoi_thue: room.nguoi_thue?.dien_thoai || null,
        ngay_sinh_nguoi_thue: room.nguoi_thue?.ngay_sinh || null,
        can_cuoc_nguoi_thue: room.nguoi_thue?.can_cuoc || null,
        don_gia_snapshot: utilityRate, // Lưu snapshot đơn giá
        phi_hoa_don: {
          create: billFees.map(fee => ({
            ten_phi: fee.ten_phi,
            so_tien: fee.so_tien,
            loai_phi_id: fee.loai_phi_id,
          }))
        }
      },
      include: {
        phong: {
          select: {
            id: true,
            ma_phong: true,
            ten_phong: true,
          }
        },
        phi_hoa_don: true,
      }
    });

    // Ghi lịch sử tạo hóa đơn
    const billSnapshot = BillHistoryService.createBillSnapshot(bill);
    await BillHistoryService.createHistory({
      billId: bill.id,
      action: 'TAO_MOI',
      changedBy: session.user.id,
      newData: billSnapshot,
      description: `Tạo mới hóa đơn tháng ${bill.thang}/${bill.nam} cho phòng ${bill.phong.ma_phong}`,
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
