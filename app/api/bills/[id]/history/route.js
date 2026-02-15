import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { BillHistoryService } from '@/lib/services/bill-history.service';
import { validateResourceOwnership, isSuperAdmin } from '@/lib/middleware/authorization';
import prisma from '@/lib/prisma';

// GET /api/bills/[id]/history - Lấy lịch sử thay đổi hóa đơn
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: billId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Kiểm tra hóa đơn có tồn tại không
    const bill = await prisma.bIL_HOA_DON.findUnique({
      where: { id: billId },
      select: {
        id: true,
        phong_id: true,
        nguoi_dung_id: true,
      }
    });

    // Nếu bill không tồn tại, kiểm tra lịch sử xem có record nào với billId này không
    // và validate quyền truy cập dựa trên oldData
    if (!bill) {
      // Lấy một history record để kiểm tra quyền truy cập
      // Tìm với billId hoặc originalBillId
      let firstHistory = await prisma.bIL_LICH_SU_THAY_DOI.findFirst({
        where: {
          OR: [
            { hoa_don_id: billId },
            { hoa_don_goc_id: billId },
          ],
        },
        select: {
          du_lieu_cu: true,
          hoa_don_id: true,
          hoa_don_goc_id: true,
        },
        orderBy: { ngay_tao: 'desc' },
      });

      if (!firstHistory) {
        return NextResponse.json(
          { error: 'Không tìm thấy hóa đơn hoặc lịch sử' },
          { status: 404 }
        );
      }

      // Validate property access through oldData
      if (!isSuperAdmin(session)) {
        if (firstHistory.du_lieu_cu) {
          const oldData = typeof firstHistory.du_lieu_cu === 'string'
            ? JSON.parse(firstHistory.du_lieu_cu)
            : firstHistory.du_lieu_cu;

          // Kiểm tra userId trong oldData
          if (oldData.nguoi_dung_id && oldData.nguoi_dung_id !== session.user.id) {
            return NextResponse.json(
              { error: 'Forbidden: No access to this bill' },
              { status: 403 }
            );
          }

          // Nếu không có userId trong oldData, kiểm tra roomId
          if (oldData.phong_id) {
            const hasAccess = await validateResourceOwnership(session.user.id, oldData.phong_id, 'room');
            if (!hasAccess) {
              return NextResponse.json(
                { error: 'Forbidden: No access to this bill' },
                { status: 403 }
              );
            }
          }
        } else {
          // Không có oldData, không thể validate, từ chối
          return NextResponse.json(
            { error: 'Forbidden: No access to this bill' },
            { status: 403 }
          );
        }
      }
    } else {
      // Bill còn tồn tại, validate như bình thường
      if (!isSuperAdmin(session)) {
        const hasAccess = await validateResourceOwnership(session.user.id, bill.phong_id, 'room');
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden: No access to this bill' },
            { status: 403 }
          );
        }
      }
    }

    // Lấy lịch sử thay đổi
    // Nếu bill đã bị xóa, billId trong BillHistory có thể là null
    // Nhưng originalBillId vẫn giữ giá trị gốc
    const histories = await prisma.bIL_LICH_SU_THAY_DOI.findMany({
      where: {
        OR: [
          { hoa_don_id: billId }, // Bill còn tồn tại
          { hoa_don_goc_id: billId }, // Bill đã bị xóa, tìm với originalBillId
        ],
      },
      include: {
        nguoi_dung: {
          select: {
            id: true,
            tai_khoan: true,
          },
        },
      },
      orderBy: {
        ngay_tao: 'desc',
      },
      take: limit,
      skip: skip,
    });

    // Enrich oldData và newData với thông tin room nếu thiếu
    for (const history of histories) {
      // Enrich oldData
      if (history.du_lieu_cu) {
        const oldData = typeof history.du_lieu_cu === 'string'
          ? JSON.parse(history.du_lieu_cu)
          : history.du_lieu_cu;

        // Nếu oldData có roomId nhưng không có room object, query từ database
        if (oldData.phong_id && !oldData.phong) {
          try {
            const room = await prisma.pRP_PHONG.findUnique({
              where: { id: oldData.phong_id },
              select: {
                id: true,
                ma_phong: true,
                ten_phong: true,
              },
            });

            if (room) {
              oldData.phong = {
                id: room.id,
                ma_phong: room.ma_phong,
                ten_phong: room.ten_phong,
              };
              history.du_lieu_cu = oldData;
            }
          } catch (error) {
            console.warn(`Could not fetch room ${oldData.phong_id} for history ${history.id}:`, error.message);
          }
        }
      }

      // Enrich newData
      if (history.du_lieu_moi) {
        const newData = typeof history.du_lieu_moi === 'string'
          ? JSON.parse(history.du_lieu_moi)
          : history.du_lieu_moi;

        // Nếu newData có roomId nhưng không có room object, query từ database
        if (newData.phong_id && !newData.phong) {
          try {
            const room = await prisma.pRP_PHONG.findUnique({
              where: { id: newData.phong_id },
              select: {
                id: true,
                ma_phong: true,
                ten_phong: true,
              },
            });

            if (room) {
              newData.phong = {
                id: room.id,
                ma_phong: room.ma_phong,
                ten_phong: room.ten_phong,
              };
              history.du_lieu_moi = newData;
            }
          } catch (error) {
            console.warn(`Could not fetch room ${newData.phong_id} for history ${history.id}:`, error.message);
          }
        }
      }
    }

    return NextResponse.json({
      data: histories,
      total: histories.length,
    });
  } catch (error) {
    console.error('Error fetching bill history:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      billId,
    });
    return NextResponse.json(
      {
        error: 'Lỗi khi lấy lịch sử thay đổi hóa đơn',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
