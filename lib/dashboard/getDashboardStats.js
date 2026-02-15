import prisma from '@/lib/prisma';
import { calculateTotalDebt } from '@/lib/debt/calculateTotalDebt';

/**
 * Tính toán các chỉ số thống kê cho Dashboard
 * Requirements: 13.2-13.8, 5.4, 5.5
 * 
 * @param {string} userId - User ID for property owner (optional, for Super Admin returns all)
 * @returns {Promise<Object>} Đối tượng chứa các chỉ số thống kê
 */
export async function getDashboardStats(userId = null) {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        // Build where clause for property scoping
        const roomWhere = userId ? { nguoi_dung_id: userId } : {};
        const billWhere = userId
            ? {
                thang: currentMonth,
                nam: currentYear,
                phong: { nguoi_dung_id: userId }
            }
            : {
                thang: currentMonth,
                nam: currentYear,
            };

        // Đếm tổng số phòng theo trạng thái (scoped to property owner)
        const totalRooms = await prisma.pRP_PHONG.count({ where: roomWhere });
        const emptyRooms = await prisma.pRP_PHONG.count({
            where: { ...roomWhere, trang_thai: 'TRONG' }
        });
        const occupiedRooms = await prisma.pRP_PHONG.count({
            where: { ...roomWhere, trang_thai: 'DA_THUE' }
        });

        // Lấy danh sách phòng trống (scoped to property owner)
        const emptyRoomsList = await prisma.pRP_PHONG.findMany({
            where: { ...roomWhere, trang_thai: 'TRONG' },
            select: {
                id: true,
                ma_phong: true,
                ten_phong: true,
                gia_phong: true,
            },
            orderBy: { ma_phong: 'asc' }
        });

        // Thống kê hóa đơn tháng hiện tại (scoped to property owner)
        const currentMonthBills = await prisma.bIL_HOA_DON.findMany({
            where: billWhere,
            select: {
                id: true,
                tong_tien: true,
                da_thanh_toan: true,
                so_tien_da_tra: true,
            }
        });

        // Tính tổng tiền chưa thu (hóa đơn chưa thanh toán)
        const unpaidBills = currentMonthBills.filter(bill => !bill.da_thanh_toan);
        const unpaidBillsCount = unpaidBills.length;
        const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => {
            return sum + Number(bill.tong_tien);
        }, 0);

        // Tính tổng doanh thu tháng hiện tại (hóa đơn đã thanh toán)
        const paidBills = currentMonthBills.filter(bill => bill.da_thanh_toan);
        const monthlyRevenue = paidBills.reduce((sum, bill) => {
            const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : Number(bill.tong_tien);
            return sum + paidAmount;
        }, 0);

        // Tính tổng nợ của tất cả phòng (scoped to property owner)
        const allRooms = await prisma.pRP_PHONG.findMany({
            where: roomWhere,
            select: { id: true }
        });

        let totalDebt = 0;
        for (const room of allRooms) {
            const roomDebt = await calculateTotalDebt(room.id);
            totalDebt += roomDebt;
        }

        return {
            // Thống kê phòng
            totalRooms,
            emptyRooms,
            occupiedRooms,
            emptyRoomsList: emptyRoomsList.map(room => ({
                id: room.id,
                code: room.ma_phong,
                name: room.ten_phong,
                price: Number(room.gia_phong),
            })),

            // Thống kê hóa đơn tháng hiện tại
            unpaidBillsCount,
            totalUnpaidAmount,
            monthlyRevenue,

            // Tổng nợ tích lũy
            totalDebt,

            // Thông tin tháng hiện tại
            currentMonth,
            currentYear,
        };
    } catch (error) {
        console.error('Lỗi khi tính toán thống kê dashboard:', error);
        throw error;
    }
}
