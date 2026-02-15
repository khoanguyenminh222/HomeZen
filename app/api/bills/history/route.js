import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/middleware/authorization';

// GET /api/bills/history - Lấy lịch sử thay đổi của tất cả hóa đơn
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const action = searchParams.get('action'); // Filter by action type
    const billId = searchParams.get('billId'); // Filter by specific bill
    const roomId = searchParams.get('roomId'); // Filter by room
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null; // Filter by month
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : null; // Filter by year

    // Build where clause using AND array to avoid overwriting OR clauses
    const where = { AND: [] };

    // Filter by action if provided
    if (action) {
      where.AND.push({ hanh_dong: action });
    }

    // Filter by roomId if provided
    if (roomId) {
      where.AND.push({
        OR: [
          { hoa_don: { phong_id: roomId } },
          { du_lieu_cu: { path: ['phong_id'], equals: roomId } },
          { du_lieu_moi: { path: ['phong_id'], equals: roomId } },
        ]
      });
    }

    // Get all bill IDs that belong to this user (for Property Owners)
    let userBillIds = [];
    if (!isSuperAdmin(session)) {
      const userBills = await prisma.bIL_HOA_DON.findMany({
        where: { nguoi_dung_id: session.user.id },
        select: { id: true },
      });
      userBillIds = userBills.map(b => b.id);
    }

    // Filter by billId if provided
    if (billId) {
      where.AND.push({
        OR: [
          { hoa_don_id: billId },
          { hoa_don_goc_id: billId },
        ]
      });
    } else if (!isSuperAdmin(session)) {
      if (userBillIds.length > 0) {
        where.AND.push({
          OR: [
            { hoa_don_id: { in: userBillIds } },
            { hoa_don_goc_id: { in: userBillIds } },
            { hoa_don_id: null }, // Lấy các histories của bill đã xóa
          ]
        });
      } else {
        where.AND.push({ hoa_don_id: null });
      }
    }

    // Get histories
    const queryLimit = !isSuperAdmin(session) ? limit * 4 : limit * 2;

    let histories = await prisma.bIL_LICH_SU_THAY_DOI.findMany({
      where,
      include: {
        nguoi_dung: {
          select: {
            id: true,
            tai_khoan: true,
          },
        },
        hoa_don: {
          select: {
            id: true,
            thang: true,
            nam: true,
            nguoi_dung_id: true,
            phong: {
              select: {
                id: true,
                ma_phong: true,
                ten_phong: true,
              },
            },
          },
        },
      },
      orderBy: {
        ngay_tao: 'desc',
      },
      take: queryLimit,
      skip: skip,
    });

    // Enrich oldData và newData với thông tin room nếu thiếu
    for (const history of histories) {
      // Enrich oldData
      if (history.du_lieu_cu) {
        const oldData = typeof history.du_lieu_cu === 'string'
          ? JSON.parse(history.du_lieu_cu)
          : history.du_lieu_cu;

        // Query room info if missing
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

        // Ensure userId
        if (!oldData.nguoi_dung_id && history.hoa_don?.nguoi_dung_id) {
          oldData.nguoi_dung_id = history.hoa_don.nguoi_dung_id;
          history.du_lieu_cu = oldData;
        }
      }

      // Enrich newData
      if (history.du_lieu_moi) {
        const newData = typeof history.du_lieu_moi === 'string'
          ? JSON.parse(history.du_lieu_moi)
          : history.du_lieu_moi;

        // Query room info if missing
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

        // Ensure userId
        if (!newData.nguoi_dung_id && history.hoa_don?.nguoi_dung_id) {
          newData.nguoi_dung_id = history.hoa_don.nguoi_dung_id;
          history.du_lieu_moi = newData;
        }
      }
    }

    // Filter by userId, roomId, month, year
    if (!isSuperAdmin(session)) {
      histories = histories.filter(history => {
        if (history.hoa_don && history.hoa_don.nguoi_dung_id === session.user.id) {
          return true;
        }

        if (!history.hoa_don || !history.hoa_don_id) {
          // Check oldData
          if (history.du_lieu_cu) {
            const oldData = typeof history.du_lieu_cu === 'string'
              ? JSON.parse(history.du_lieu_cu)
              : history.du_lieu_cu;
            if (oldData.nguoi_dung_id === session.user.id) return true;
          }

          // Check newData
          if (history.du_lieu_moi) {
            const newData = typeof history.du_lieu_moi === 'string'
              ? JSON.parse(history.du_lieu_moi)
              : history.du_lieu_moi;
            if (newData.nguoi_dung_id === session.user.id) return true;
          }

          if (history.hoa_don_id && userBillIds.includes(history.hoa_don_id)) return true;
          if (history.hoa_don_goc_id && userBillIds.includes(history.hoa_don_goc_id)) return true;
        }

        return false;
      });
    }

    // Filter by roomId, month, year
    if (roomId || month !== null || year !== null) {
      histories = histories.filter(history => {
        let billRoomId = null;
        let billMonth = null;
        let billYear = null;

        if (history.hoa_don) {
          billRoomId = history.hoa_don.phong?.id || null;
          billMonth = history.hoa_don.thang;
          billYear = history.hoa_don.nam;
        } else {
          // Try oldData
          if (history.du_lieu_cu) {
            const oldData = typeof history.du_lieu_cu === 'string'
              ? JSON.parse(history.du_lieu_cu)
              : history.du_lieu_cu;
            billRoomId = oldData.phong?.id || oldData.phong_id || null;
            billMonth = oldData.thang || null;
            billYear = oldData.nam || null;
          }

          // Try newData
          if ((!billRoomId || billMonth === null || billYear === null) && history.du_lieu_moi) {
            const newData = typeof history.du_lieu_moi === 'string'
              ? JSON.parse(history.du_lieu_moi)
              : history.du_lieu_moi;
            if (!billRoomId) billRoomId = newData.phong?.id || newData.phong_id || null;
            if (billMonth === null) billMonth = newData.thang || null;
            if (billYear === null) billYear = newData.nam || null;
          }
        }

        if (roomId && billRoomId !== roomId) return false;
        if (month !== null && billMonth !== month) return false;
        if (year !== null && billYear !== year) return false;

        return true;
      });
    }

    // Get total count BEFORE slicing
    let total;
    if (isSuperAdmin(session)) {
      total = await prisma.bIL_LICH_SU_THAY_DOI.count({ where });
    } else {
      total = histories.length;
    }

    // Slice results after filtering (for non-admins)
    if (!isSuperAdmin(session)) {
      histories = histories.slice(0, limit);
    }

    return NextResponse.json({
      data: histories,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bill histories:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy lịch sử thay đổi hóa đơn' },
      { status: 500 }
    );
  }
}
