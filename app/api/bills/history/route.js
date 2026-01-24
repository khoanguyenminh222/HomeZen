import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { isSuperAdmin, validateResourceOwnership } from '@/lib/middleware/authorization';

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

    // Build where clause
    const where = {};

    // Filter by action if provided
    if (action) {
      where.action = action;
    }

    // Get all bill IDs that belong to this user (for Property Owners)
    // Lưu ý: Chỉ lấy các bill còn tồn tại, các bill đã xóa sẽ được filter sau khi enrich oldData/newData
    let userBillIds = [];
    if (!isSuperAdmin(session)) {
      const userBills = await prisma.bill.findMany({
        where: { userId: session.user.id },
        select: { id: true },
      });
      userBillIds = userBills.map(b => b.id);
    }

    // Filter by billId if provided
    if (billId) {
      where.OR = [
        { billId: billId },
        { originalBillId: billId },
      ];
    } else if (!isSuperAdmin(session)) {
      // For Property Owners: Query rộng để lấy cả các bill đã xóa
      // Vì không thể query JSON field (oldData/newData.userId) trực tiếp,
      // nên query với điều kiện rộng và filter sau khi enrich
      if (userBillIds.length > 0) {
        // Query các histories có billId hoặc originalBillId trong userBillIds
        // Cũng query các histories có billId = null để lấy các bill đã xóa
        where.OR = [
          { billId: { in: userBillIds } },
          { originalBillId: { in: userBillIds } },
          { billId: null }, // Lấy các histories của bill đã xóa (sẽ filter bằng userId sau)
        ];
      } else {
        // Nếu không có bill nào, chỉ query các histories có billId = null
        where.billId = null;
      }
    }

    // Get histories
    // For Property Owners, query nhiều hơn để lấy cả các bill đã xóa (sẽ filter sau)
    const queryLimit = !isSuperAdmin(session) ? limit * 4 : limit * 2;
    
    let histories = await prisma.billHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        bill: {
          select: {
            id: true,
            month: true,
            year: true,
            userId: true,
            room: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: queryLimit, // Fetch more to account for filtering (especially for deleted bills)
      skip: skip,
    });

    // Enrich oldData và newData với thông tin room nếu thiếu
    for (const history of histories) {
      // Enrich oldData
      if (history.oldData) {
        const oldData = typeof history.oldData === 'string' 
          ? JSON.parse(history.oldData) 
          : history.oldData;
        
        // Nếu oldData có roomId nhưng không có room object, query từ database
        if (oldData.roomId && !oldData.room) {
          try {
            const room = await prisma.room.findUnique({
              where: { id: oldData.roomId },
              select: {
                id: true,
                code: true,
                name: true,
              },
            });
            
            if (room) {
              oldData.room = {
                id: room.id,
                code: room.code,
                name: room.name,
              };
              history.oldData = oldData;
            }
          } catch (error) {
            console.warn(`Could not fetch room ${oldData.roomId} for history ${history.id}:`, error.message);
          }
        }
        
        // Đảm bảo oldData có userId để filter đúng
        if (!oldData.userId && history.bill?.userId) {
          oldData.userId = history.bill.userId;
          history.oldData = oldData;
        }
      }
      
      // Enrich newData
      if (history.newData) {
        const newData = typeof history.newData === 'string' 
          ? JSON.parse(history.newData) 
          : history.newData;
        
        // Nếu newData có roomId nhưng không có room object, query từ database
        if (newData.roomId && !newData.room) {
          try {
            const room = await prisma.room.findUnique({
              where: { id: newData.roomId },
              select: {
                id: true,
                code: true,
                name: true,
              },
            });
            
            if (room) {
              newData.room = {
                id: room.id,
                code: room.code,
                name: room.name,
              };
              history.newData = newData;
            }
          } catch (error) {
            console.warn(`Could not fetch room ${newData.roomId} for history ${history.id}:`, error.message);
          }
        }
        
        // Đảm bảo newData có userId để filter đúng
        if (!newData.userId && history.bill?.userId) {
          newData.userId = history.bill.userId;
          history.newData = newData;
        }
      }
    }

    // Filter by userId, roomId, month, year
    // For Property Owners, filter deleted bills by userId in oldData/newData
    if (!isSuperAdmin(session)) {
      histories = histories.filter(history => {
        // If bill exists and belongs to user, include it
        if (history.bill && history.bill.userId === session.user.id) {
          return true;
        }
        
        // If bill is deleted (billId is null or bill relation is null), check oldData/newData
        if (!history.bill || !history.billId) {
          // Check oldData
          if (history.oldData) {
            const oldData = typeof history.oldData === 'string' 
              ? JSON.parse(history.oldData) 
              : history.oldData;
            if (oldData.userId === session.user.id) {
              return true;
            }
          }
          
          // Check newData
          if (history.newData) {
            const newData = typeof history.newData === 'string' 
              ? JSON.parse(history.newData) 
              : history.newData;
            if (newData.userId === session.user.id) {
              return true;
            }
          }
          
          // Also check if the billId (before deletion) was in userBillIds
          if (history.billId && userBillIds.includes(history.billId)) {
            return true;
          }
          
          // Check originalBillId
          if (history.originalBillId && userBillIds.includes(history.originalBillId)) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    // Filter by roomId, month, year (apply to all users)
    if (roomId || month !== null || year !== null) {
      histories = histories.filter(history => {
        let billRoomId = null;
        let billMonth = null;
        let billYear = null;
        
        // Get roomId, month, year from bill relation or oldData/newData
        if (history.bill) {
          billRoomId = history.bill.room?.id || null;
          billMonth = history.bill.month;
          billYear = history.bill.year;
        } else {
          // Try oldData first (for DELETE action)
          if (history.oldData) {
            const oldData = typeof history.oldData === 'string' 
              ? JSON.parse(history.oldData) 
              : history.oldData;
            billRoomId = oldData.room?.id || oldData.roomId || null;
            billMonth = oldData.month || null;
            billYear = oldData.year || null;
          }
          
          // Fallback to newData if not found in oldData
          if ((!billRoomId || billMonth === null || billYear === null) && history.newData) {
            const newData = typeof history.newData === 'string' 
              ? JSON.parse(history.newData) 
              : history.newData;
            if (!billRoomId) billRoomId = newData.room?.id || newData.roomId || null;
            if (billMonth === null) billMonth = newData.month || null;
            if (billYear === null) billYear = newData.year || null;
          }
        }
        
        // Apply filters
        if (roomId && billRoomId !== roomId) {
          return false;
        }
        if (month !== null && billMonth !== month) {
          return false;
        }
        if (year !== null && billYear !== year) {
          return false;
        }
        
        return true;
      });
    }
    
    // Limit after filtering (for Property Owners)
    if (!isSuperAdmin(session)) {
      histories = histories.slice(0, limit);
    }

    // Get total count (approximate for Property Owners)
    let total;
    if (isSuperAdmin(session)) {
      total = await prisma.billHistory.count({ where });
    } else {
      // For Property Owners, count is approximate (we filtered in code)
      total = histories.length;
    }

    return NextResponse.json({
      data: histories,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Error fetching bill histories:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy lịch sử thay đổi hóa đơn' },
      { status: 500 }
    );
  }
}
