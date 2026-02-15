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
    const bill = await prisma.bIL_HOA_DON.findUnique({
      where: { id: billId },
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

    // Không cho phép thêm phí vào hóa đơn đã thanh toán
    if (bill.da_thanh_toan) {
      return NextResponse.json(
        { error: 'Không thể thêm phí vào hóa đơn đã thanh toán' },
        { status: 400 }
      );
    }

    // Thêm phí phát sinh
    const billFee = await prisma.bIL_PHI_HOA_DON.create({
      data: {
        hoa_don_id: billId,
        ten_phi: validatedData.ten_phi,
        so_tien: validatedData.so_tien,
        loai_phi_id: validatedData.loai_phi_id,
      }
    });

    // Tính toán lại tổng tiền hóa đơn
    const propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.findFirst();
    if (!propertyInfo) {
      return NextResponse.json(
        { error: 'Chưa cấu hình thông tin nhà trọ' },
        { status: 400 }
      );
    }

    const utilityRate = await getUtilityRateForRoom(bill.phong_id);
    const occupantCount = bill.phong.nguoi_thue
      ? 1 + (bill.phong.nguoi_thue.nguoi_o?.length || 0)
      : 1;

    // Lấy tất cả phí phát sinh (bao gồm phí vừa thêm)
    const allBillFees = await prisma.bIL_PHI_HOA_DON.findMany({
      where: { hoa_don_id: billId }
    });

    const calculation = await calculateBill({
      phong_id: bill.phong_id,
      chi_so_dien_cu: bill.chi_so_dien_cu,
      chi_so_dien_moi: bill.chi_so_dien_moi,
      chi_so_nuoc_cu: bill.chi_so_nuoc_cu,
      chi_so_nuoc_moi: bill.chi_so_nuoc_moi,
      room: bill.phong,
      propertyInfo,
      utilityRate,
      bac_thang_gia: utilityRate.bac_thang_gia || [],
      occupantCount,
      billFees: allBillFees,
    });

    // Cập nhật tổng tiền hóa đơn
    const updatedBill = await prisma.bIL_HOA_DON.update({
      where: { id: billId },
      data: {
        tong_tien: calculation.totalCost,
        tong_tien_chu: calculation.totalCostText,
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

    // Ghi lịch sử thêm phí
    const oldSnapshot = BillHistoryService.createBillSnapshot(bill);
    const newSnapshot = BillHistoryService.createBillSnapshot(updatedBill);

    await BillHistoryService.createHistory({
      billId: billId,
      action: 'THEM_PHI',
      changedBy: session.user.id,
      oldData: oldSnapshot,
      newData: newSnapshot,
      description: `Thêm phí phát sinh: ${validatedData.ten_phi} - ${validatedData.so_tien.toLocaleString('vi-VN')} VNĐ`,
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
