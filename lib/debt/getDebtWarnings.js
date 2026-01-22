import prisma from '@/lib/prisma';
import { calculateConsecutiveUnpaidMonths } from './calculateConsecutiveUnpaidMonths';
import { calculateTotalDebt } from './calculateTotalDebt';

/**
 * Lấy danh sách phòng nợ 2+ tháng liên tiếp
 * Requirements: 18.5
 * 
 * @returns {Promise<Array>} Danh sách phòng nợ với thông tin chi tiết
 */
export async function getDebtWarnings() {
  try {
    // Lấy tất cả phòng đang có người thuê
    const occupiedRooms = await prisma.room.findMany({
      where: {
        status: 'OCCUPIED',
      },
      select: {
        id: true,
        code: true,
        name: true,
        tenant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    const warnings = [];

    // Kiểm tra từng phòng
    for (const room of occupiedRooms) {
      const consecutiveMonths = await calculateConsecutiveUnpaidMonths(room.id);
      
      // Chỉ thêm vào danh sách cảnh báo nếu nợ 2+ tháng
      if (consecutiveMonths >= 2) {
        const totalDebt = await calculateTotalDebt(room.id);
        
        // Lấy danh sách hóa đơn chưa thanh toán
        const unpaidBills = await prisma.bill.findMany({
          where: {
            roomId: room.id,
            isPaid: false,
          },
          orderBy: [
            { year: 'desc' },
            { month: 'desc' },
          ],
          select: {
            id: true,
            month: true,
            year: true,
            totalCost: true,
            createdAt: true,
          },
        });

        warnings.push({
          roomId: room.id,
          roomCode: room.code,
          roomName: room.name,
          tenantName: room.tenant?.fullName || 'Chưa có',
          tenantPhone: room.tenant?.phone || 'Chưa có',
          consecutiveMonths,
          totalDebt,
          unpaidBills: unpaidBills.map(bill => ({
            id: bill.id,
            month: bill.month,
            year: bill.year,
            totalCost: Number(bill.totalCost),
            createdAt: bill.createdAt,
          })),
        });
      }
    }

    // Sắp xếp theo số tháng nợ giảm dần
    warnings.sort((a, b) => b.consecutiveMonths - a.consecutiveMonths);

    return warnings;
  } catch (error) {
    console.error('Error getting debt warnings:', error);
    throw error;
  }
}
