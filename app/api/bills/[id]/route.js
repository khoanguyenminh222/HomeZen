import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateBillSchema } from '@/lib/validations/bill';
import { calculateBill } from '@/lib/bills/calculateBill';
import { getUtilityRateForRoom } from '@/lib/bills/getUtilityRateForRoom';
import { validateResourceOwnership, isSuperAdmin } from '@/lib/middleware/authorization';
import { BillHistoryService } from '@/lib/services/bill-history.service';

// GET /api/bills/[id] - Chi tiết hóa đơn
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const bill = await prisma.bIL_HOA_DON.findUnique({
      where: { id },
      include: {
        phong: {
          include: {
            nguoi_thue: {
              include: {
                nguoi_o: true,
              }
            }
          }
        },
        phi_hoa_don: true,
      }
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Validate property access through room
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, bill.phong_id, 'room');
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: No access to this bill' },
          { status: 403 }
        );
      }
    }

    // Tính toán lại để lấy breakdown (ưu tiên dùng snapshot từ DB)
    const utilityRate = bill.don_gia_snapshot || await getUtilityRateForRoom(bill.phong_id);
    const propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.findFirst();

    // Tính số người ở tại thời điểm hiện tại (có thể khác lúc tạo bill nhưng là cách tốt nhất để lấy config)
    const occupantCount = bill.phong.nguoi_thue
      ? 1 + (bill.phong.nguoi_thue.nguoi_o?.length || 0)
      : 1;

    const calculation = await calculateBill({
      phong_id: bill.phong_id,
      chi_so_dien_cu: bill.chi_so_dien_cu,
      chi_so_dien_moi: bill.chi_so_dien_moi,
      chi_so_nuoc_cu: bill.chi_so_nuoc_cu,
      chi_so_nuoc_moi: bill.chi_so_nuoc_moi,
      room: bill.phong,
      propertyInfo: propertyInfo || {},
      utilityRate,
      bac_thang_gia: utilityRate.bac_thang_gia || [],
      occupantCount,
      billFees: bill.phi_hoa_don || [],
    });

    return NextResponse.json({
      ...bill,
      electricityBreakdown: calculation.electricityBreakdown,
      waterBreakdown: calculation.waterBreakdown
    });
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
    const existingBill = await prisma.bIL_HOA_DON.findUnique({
      where: { id },
      include: {
        phong: {
          include: {
            nguoi_thue: {
              include: {
                nguoi_o: true,
              }
            }
          }
        },
        phi_hoa_don: true,
      }
    });

    if (!existingBill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Validate property access through room
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, existingBill.phong_id, 'room');
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: No access to this bill' },
          { status: 403 }
        );
      }
    }

    // Không cho phép sửa hóa đơn đã thanh toán
    if (existingBill.da_thanh_toan) {
      return NextResponse.json(
        { error: 'Không thể sửa hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Validate dữ liệu
    const validatedData = updateBillSchema.parse({ ...body, id });

    // Kiểm tra trùng lặp nếu có thay đổi tháng hoặc năm
    const newThang = validatedData.thang ?? existingBill.thang;
    const newNam = validatedData.nam ?? existingBill.nam;

    if (newThang !== existingBill.thang || newNam !== existingBill.nam) {
      const duplicateBill = await prisma.bIL_HOA_DON.findFirst({
        where: {
          id: { not: id },
          phong_id: existingBill.phong_id,
          thang: newThang,
          nam: newNam,
        }
      });

      if (duplicateBill) {
        return NextResponse.json(
          { error: `Hóa đơn tháng ${newThang}/${newNam} đã tồn tại cho phòng này` },
          { status: 400 }
        );
      }
    }

    // Lấy thông tin cần thiết
    const room = existingBill.phong;
    const propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.findFirst();
    if (!propertyInfo) {
      return NextResponse.json(
        { error: 'Chưa cấu hình thông tin nhà trọ' },
        { status: 400 }
      );
    }

    const utilityRate = await getUtilityRateForRoom(room.id);

    // Lấy các phí phát sinh hiện tại (giữ nguyên nếu không cập nhật)
    const currentBillFees = await prisma.bIL_PHI_HOA_DON.findMany({
      where: { hoa_don_id: id }
    });

    const billFees = currentBillFees.map(fee => ({
      ten_phi: fee.ten_phi,
      so_tien: fee.so_tien,
      loai_phi_id: fee.loai_phi_id,
    }));

    // Tính số người ở
    const occupantCount = room.nguoi_thue
      ? 1 + (room.nguoi_thue.nguoi_o?.length || 0)
      : 1;

    // Tính toán lại hóa đơn
    const calculation = await calculateBill({
      phong_id: room.id,
      chi_so_dien_cu: validatedData.chi_so_dien_cu ?? existingBill.chi_so_dien_cu,
      chi_so_dien_moi: validatedData.chi_so_dien_moi ?? existingBill.chi_so_dien_moi,
      chi_so_nuoc_cu: validatedData.chi_so_nuoc_cu ?? existingBill.chi_so_nuoc_cu,
      chi_so_nuoc_moi: validatedData.chi_so_nuoc_moi ?? existingBill.chi_so_nuoc_moi,
      room,
      propertyInfo,
      utilityRate,
      bac_thang_gia: utilityRate.bac_thang_gia || [],
      occupantCount,
      billFees,
    });

    // Cập nhật thông tin tenant (snapshot tại thời điểm cập nhật)
    const tenantInfo = room?.nguoi_thue ? {
      ten_nguoi_thue: room.nguoi_thue.ho_ten,
      sdt_nguoi_thue: room.nguoi_thue.dien_thoai,
      ngay_sinh_nguoi_thue: room.nguoi_thue.ngay_sinh,
      can_cuoc_nguoi_thue: room.nguoi_thue.can_cuoc,
    } : {
      ten_nguoi_thue: null,
      sdt_nguoi_thue: null,
      ngay_sinh_nguoi_thue: null,
      can_cuoc_nguoi_thue: null,
    };

    // Cập nhật hóa đơn
    const bill = await prisma.bIL_HOA_DON.update({
      where: { id },
      data: {
        thang: validatedData.thang ?? existingBill.thang,
        nam: validatedData.nam ?? existingBill.nam,
        chi_so_dien_cu: validatedData.chi_so_dien_cu ?? existingBill.chi_so_dien_cu,
        chi_so_dien_moi: validatedData.chi_so_dien_moi ?? existingBill.chi_so_dien_moi,
        tieu_thu_dien: calculation.electricityUsage,
        dien_vuot_nguong: calculation.electricityRollover,
        chi_so_nuoc_cu: validatedData.chi_so_nuoc_cu ?? existingBill.chi_so_nuoc_cu,
        chi_so_nuoc_moi: validatedData.chi_so_nuoc_moi ?? existingBill.chi_so_nuoc_moi,
        tieu_thu_nuoc: calculation.waterUsage,
        nuoc_vuot_nguong: calculation.waterRollover,
        anh_dong_ho_dien: validatedData.url_anh_dong_ho_dien ?? existingBill.anh_dong_ho_dien,
        anh_dong_ho_nuoc: validatedData.url_anh_dong_ho_nuoc ?? existingBill.anh_dong_ho_nuoc,
        gia_phong: calculation.roomPrice,
        tien_dien: calculation.electricityCost,
        tien_nuoc: calculation.waterCost,
        tong_tien: calculation.totalCost,
        tong_tien_chu: calculation.totalCostText,
        ghi_chu: validatedData.ghi_chu ?? existingBill.ghi_chu,
        don_gia_snapshot: utilityRate, // Cập nhật snapshot khi recalculate
        ...tenantInfo,
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

    // Ghi lịch sử cập nhật hóa đơn
    const oldSnapshot = BillHistoryService.createBillSnapshot(existingBill);
    const newSnapshot = BillHistoryService.createBillSnapshot(bill);
    const changes = BillHistoryService.compareSnapshots(oldSnapshot, newSnapshot);

    await BillHistoryService.createHistory({
      billId: bill.id,
      action: 'CAP_NHAT',
      changedBy: session.user.id,
      oldData: oldSnapshot,
      newData: newSnapshot,
      changes: changes,
      description: BillHistoryService.generateDescription('CAP_NHAT', changes),
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
    const bill = await prisma.bIL_HOA_DON.findUnique({
      where: { id },
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

    if (!bill) {
      return NextResponse.json(
        { error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    // Validate property access through room
    if (!isSuperAdmin(session)) {
      const hasAccess = await validateResourceOwnership(session.user.id, bill.phong_id, 'room');
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: No access to this bill' },
          { status: 403 }
        );
      }
    }

    // Không cho phép xóa hóa đơn đã thanh toán
    if (bill.da_thanh_toan) {
      return NextResponse.json(
        { error: 'Không thể xóa hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Ghi lịch sử xóa hóa đơn (trước khi xóa)
    const billSnapshot = BillHistoryService.createBillSnapshot(bill);
    await BillHistoryService.createHistory({
      billId: bill.id,
      action: 'XOA',
      changedBy: session.user.id,
      oldData: billSnapshot,
      description: `Xóa hóa đơn tháng ${bill.thang}/${bill.nam} cho phòng ${bill.phong.ma_phong}`,
    });

    // Xóa hóa đơn (BillFee sẽ tự động xóa do cascade)
    await prisma.bIL_HOA_DON.delete({
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
