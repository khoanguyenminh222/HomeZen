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
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        roomId: true,
        userId: true,
      }
    });

    // Nếu bill không tồn tại, kiểm tra lịch sử xem có record nào với billId này không
    // và validate quyền truy cập dựa trên oldData
    if (!bill) {
      // Lấy một history record để kiểm tra quyền truy cập
      // Tìm với billId hoặc originalBillId
      let firstHistory = await prisma.billHistory.findFirst({
        where: {
          OR: [
            { billId },
            { originalBillId: billId },
          ],
        },
        select: {
          oldData: true,
          billId: true,
          originalBillId: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!firstHistory) {
        return NextResponse.json(
          { error: 'Không tìm thấy hóa đơn hoặc lịch sử' },
          { status: 404 }
        );
      }

      // Validate property access through oldData
      if (!isSuperAdmin(session)) {
        if (firstHistory.oldData) {
          const oldData = typeof firstHistory.oldData === 'string' 
            ? JSON.parse(firstHistory.oldData) 
            : firstHistory.oldData;
          
          // Kiểm tra userId trong oldData
          if (oldData.userId && oldData.userId !== session.user.id) {
            return NextResponse.json(
              { error: 'Forbidden: No access to this bill' },
              { status: 403 }
            );
          }
          
          // Nếu không có userId trong oldData, kiểm tra roomId
          if (oldData.roomId) {
            const hasAccess = await validateResourceOwnership(session.user.id, oldData.roomId, 'room');
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
        const hasAccess = await validateResourceOwnership(session.user.id, bill.roomId, 'room');
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
    const histories = await prisma.billHistory.findMany({
      where: {
        OR: [
          { billId: billId }, // Bill còn tồn tại
          { originalBillId: billId }, // Bill đã bị xóa, tìm với originalBillId
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
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
