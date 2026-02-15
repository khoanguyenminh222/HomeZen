import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateBillStatusSchema } from '@/lib/validations/bill';
import { BillHistoryService } from '@/lib/services/bill-history.service';

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

    const totalCost = Number(bill.tong_tien);
    let paidAmount = null;

    // Xử lý so_tien_da_tra
    if (validatedData.da_thanh_toan) {
      if (validatedData.so_tien_da_tra !== undefined && validatedData.so_tien_da_tra !== null) {
        // Kiểm tra so_tien_da_tra không được vượt quá totalCost
        if (validatedData.so_tien_da_tra > totalCost) {
          return NextResponse.json(
            { error: `Số tiền đã thanh toán (${validatedData.so_tien_da_tra.toLocaleString('vi-VN')} VNĐ) không được vượt quá tổng tiền hóa đơn (${totalCost.toLocaleString('vi-VN')} VNĐ)` },
            { status: 400 }
          );
        }
        paidAmount = validatedData.so_tien_da_tra;
      } else {
        // Nếu không có so_tien_da_tra, mặc định là thanh toán đầy đủ
        paidAmount = totalCost;
      }
    } else {
      // Nếu da_thanh_toan = false, thì so_tien_da_tra = null
      paidAmount = null;
    }

    // Cập nhật trạng thái
    const updatedBill = await prisma.bIL_HOA_DON.update({
      where: { id },
      data: {
        da_thanh_toan: validatedData.da_thanh_toan,
        so_tien_da_tra: paidAmount,
        ngay_thanh_toan: validatedData.da_thanh_toan
          ? (validatedData.ngay_thanh_toan ? new Date(validatedData.ngay_thanh_toan) : new Date())
          : null,
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

    // Ghi lịch sử thay đổi trạng thái
    const oldSnapshot = BillHistoryService.createBillSnapshot(bill);
    const newSnapshot = BillHistoryService.createBillSnapshot(updatedBill);
    const changes = BillHistoryService.compareSnapshots(oldSnapshot, newSnapshot);

    const statusText = validatedData.da_thanh_toan
      ? (paidAmount === totalCost ? 'đã thanh toán đầy đủ' : `đã thanh toán một phần (${paidAmount?.toLocaleString('vi-VN')} VNĐ)`)
      : 'chưa thanh toán';

    await BillHistoryService.createHistory({
      billId: updatedBill.id,
      action: 'THAY_DOI_TRANG_THAI',
      changedBy: session.user.id,
      oldData: oldSnapshot,
      newData: newSnapshot,
      changes: changes,
      description: `Thay đổi trạng thái thanh toán: ${statusText}`,
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
