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
    const occupiedRooms = await prisma.pRP_PHONG.findMany({
      where: {
        trang_thai: 'DA_THUE',
      },
      select: {
        id: true,
        ma_phong: true,
        ten_phong: true,
        nguoi_thue: {
          select: {
            id: true,
            ho_ten: true,
            dien_thoai: true,
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
        const unpaidBills = await prisma.bIL_HOA_DON.findMany({
          where: {
            phong_id: room.id,
            da_thanh_toan: false,
          },
          orderBy: [
            { nam: 'desc' },
            { thang: 'desc' },
          ],
          select: {
            id: true,
            thang: true,
            nam: true,
            tong_tien: true,
            ngay_tao: true,
          },
        });

        warnings.push({
          roomId: room.id,
          roomCode: room.ma_phong,
          roomName: room.ten_phong,
          tenantName: room.nguoi_thue?.ho_ten || 'Chưa có',
          tenantPhone: room.nguoi_thue?.dien_thoai || 'Chưa có',
          consecutiveMonths,
          totalDebt,
          unpaidBills: unpaidBills.map(bill => ({
            id: bill.id,
            month: bill.thang,
            year: bill.nam,
            totalCost: Number(bill.tong_tien),
            createdAt: bill.ngay_tao,
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
