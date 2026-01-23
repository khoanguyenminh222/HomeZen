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
        const roomWhere = userId ? { userId } : {};
        const billWhere = userId 
            ? { 
                month: currentMonth,
                year: currentYear,
                room: { userId }
            }
            : {
                month: currentMonth,
                year: currentYear,
            };

        // Đếm tổng số phòng theo trạng thái (scoped to property owner)
        const totalRooms = await prisma.room.count({ where: roomWhere });
        const emptyRooms = await prisma.room.count({
            where: { ...roomWhere, status: 'EMPTY' }
        });
        const occupiedRooms = await prisma.room.count({
            where: { ...roomWhere, status: 'OCCUPIED' }
        });

        // Lấy danh sách phòng trống (scoped to property owner)
        const emptyRoomsList = await prisma.room.findMany({
            where: { ...roomWhere, status: 'EMPTY' },
            select: {
                id: true,
                code: true,
                name: true,
                price: true,
            },
            orderBy: { code: 'asc' }
        });

        // Thống kê hóa đơn tháng hiện tại (scoped to property owner)
        const currentMonthBills = await prisma.bill.findMany({
            where: billWhere,
            select: {
                id: true,
                totalCost: true,
                isPaid: true,
                paidAmount: true,
            }
        });

        // Tính tổng tiền chưa thu (hóa đơn chưa thanh toán)
        const unpaidBills = currentMonthBills.filter(bill => !bill.isPaid);
        const unpaidBillsCount = unpaidBills.length;
        const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => {
            return sum + Number(bill.totalCost);
        }, 0);

        // Tính tổng doanh thu tháng hiện tại (hóa đơn đã thanh toán)
        const paidBills = currentMonthBills.filter(bill => bill.isPaid);
        const monthlyRevenue = paidBills.reduce((sum, bill) => {
            const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : Number(bill.totalCost);
            return sum + paidAmount;
        }, 0);

        // Tính tổng nợ của tất cả phòng (scoped to property owner)
        const allRooms = await prisma.room.findMany({
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
                code: room.code,
                name: room.name,
                price: Number(room.price),
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
