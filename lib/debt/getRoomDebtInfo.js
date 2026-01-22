import { calculateTotalDebt } from './calculateTotalDebt';
import { calculateConsecutiveUnpaidMonths } from './calculateConsecutiveUnpaidMonths';
import prisma from '@/lib/prisma';

/**
 * Lấy thông tin nợ đầy đủ của một phòng
 * Requirements: 18.2, 18.3, 18.5
 * 
 * @param {string} roomId - ID của phòng
 * @returns {Promise<Object>} Thông tin nợ của phòng
 */
export async function getRoomDebtInfo(roomId) {
  try {
    // Tính tổng nợ
    const totalDebt = await calculateTotalDebt(roomId);
    
    // Tính số tháng nợ liên tiếp
    const consecutiveMonths = await calculateConsecutiveUnpaidMonths(roomId);
    
    // Lấy tất cả hóa đơn có nợ (chưa thanh toán hoặc thanh toán một phần)
    const allBills = await prisma.bill.findMany({
      where: {
        roomId: roomId,
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
        isPaid: true,
        paidAmount: true,
        createdAt: true,
        notes: true,
      },
    });

    // Lọc các hóa đơn có nợ
    const unpaidBills = allBills
      .map(bill => {
        const totalCost = Number(bill.totalCost);
        const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
        const remainingDebt = totalCost - paidAmount;
        
        return {
          ...bill,
          totalCost,
          paidAmount,
          remainingDebt: Math.max(0, remainingDebt),
        };
      })
      .filter(bill => bill.remainingDebt > 0); // Chỉ lấy hóa đơn còn nợ

    return {
      totalDebt,
      consecutiveMonths,
      hasDebtWarning: consecutiveMonths >= 2,
      unpaidBills: unpaidBills.map(bill => ({
        id: bill.id,
        month: bill.month,
        year: bill.year,
        totalCost: bill.totalCost,
        paidAmount: bill.paidAmount,
        remainingDebt: bill.remainingDebt,
        isPaid: bill.isPaid,
        createdAt: bill.createdAt,
        notes: bill.notes,
      })),
    };
  } catch (error) {
    console.error('Error getting room debt info:', error);
    throw error;
  }
}
