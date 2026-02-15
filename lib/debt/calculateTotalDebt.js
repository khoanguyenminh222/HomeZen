import prisma from '@/lib/prisma';

/**
 * Tính tổng nợ của một phòng
 * Requirements: 18.1, 18.4
 * 
 * Logic:
 * - Hóa đơn chưa thanh toán (isPaid = false): nợ = totalCost
 * - Hóa đơn đã thanh toán một phần (isPaid = true nhưng paidAmount < totalCost): nợ = totalCost - paidAmount
 * - Hóa đơn đã thanh toán đầy đủ (isPaid = true và paidAmount >= totalCost): nợ = 0
 * 
 * @param {string} roomId - ID của phòng
 * @returns {Promise<number>} Tổng nợ tích lũy
 */
export async function calculateTotalDebt(roomId) {
  try {
    const bills = await prisma.bIL_HOA_DON.findMany({
      where: {
        phong_id: roomId,
      },
      select: {
        tong_tien: true,
        da_thanh_toan: true,
        so_tien_da_tra: true,
      },
    });

    // Tính tổng nợ từ tất cả hóa đơn
    const totalDebt = bills.reduce((sum, bill) => {
      const totalCost = Number(bill.tong_tien);

      if (!bill.da_thanh_toan) {
        // Chưa thanh toán: nợ = totalCost
        return sum + totalCost;
      } else {
        // Đã thanh toán: tính phần còn thiếu
        const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
        const remainingDebt = totalCost - paidAmount;
        return sum + Math.max(0, remainingDebt); // Đảm bảo không âm
      }
    }, 0);

    return totalDebt;
  } catch (error) {
    console.error('Error calculating total debt:', error);
    throw error;
  }
}
