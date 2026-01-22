import prisma from '@/lib/prisma';

/**
 * Tính số tháng nợ liên tiếp của một phòng
 * Requirements: 18.5
 * 
 * Logic: Tính từ hóa đơn mới nhất (có nợ) ngược lại, 
 * đếm số tháng liên tiếp có hóa đơn còn nợ (chưa thanh toán hoặc thanh toán một phần).
 * 
 * Ví dụ:
 * - Có hóa đơn còn nợ cho tháng 1/2024, 2/2024, 3/2024 → 3 tháng liên tiếp
 * - Có hóa đơn còn nợ cho tháng 1/2024, 3/2024 (thiếu tháng 2) → chỉ tính 1 tháng liên tiếp (từ tháng 3)
 * 
 * @param {string} roomId - ID của phòng
 * @returns {Promise<number>} Số tháng nợ liên tiếp
 */
export async function calculateConsecutiveUnpaidMonths(roomId) {
  try {
    // Lấy tất cả hóa đơn có nợ (chưa thanh toán hoặc thanh toán một phần), sắp xếp theo tháng/năm giảm dần
    const allBills = await prisma.bill.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      select: {
        month: true,
        year: true,
        totalCost: true,
        isPaid: true,
        paidAmount: true,
      },
    });

    // Lọc các hóa đơn còn nợ
    const unpaidBills = allBills.filter(bill => {
      const totalCost = Number(bill.totalCost);
      const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
      const remainingDebt = totalCost - paidAmount;
      return remainingDebt > 0; // Chỉ lấy hóa đơn còn nợ
    }).map(bill => ({
      month: bill.month,
      year: bill.year,
    }));

    if (unpaidBills.length === 0) {
      return 0;
    }

    // Tạo Set để dễ dàng kiểm tra xem có hóa đơn cho tháng/năm cụ thể không
    const unpaidMonthsSet = new Set(
      unpaidBills.map(bill => `${bill.year}-${bill.month}`)
    );

    // Bắt đầu từ hóa đơn mới nhất
    let consecutiveMonths = 0;
    let checkMonth = unpaidBills[0].month;
    let checkYear = unpaidBills[0].year;

    // Kiểm tra từ hóa đơn mới nhất ngược lại, tối đa 12 tháng
    for (let i = 0; i < 12; i++) {
      const monthKey = `${checkYear}-${checkMonth}`;
      
      if (unpaidMonthsSet.has(monthKey)) {
        consecutiveMonths++;
        
        // Lùi về tháng trước để kiểm tra tiếp
        checkMonth--;
        if (checkMonth < 1) {
          checkMonth = 12;
          checkYear--;
        }
      } else {
        // Nếu không có hóa đơn cho tháng này, dừng lại
        break;
      }
    }

    return consecutiveMonths;
  } catch (error) {
    console.error('Error calculating consecutive unpaid months:', error);
    throw error;
  }
}
