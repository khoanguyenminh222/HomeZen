import prisma from '@/lib/prisma';

/**
 * Lấy danh sách phòng cần chốt số điện nước
 * Requirements: 13.6-13.8
 * 
 * Logic:
 * - Lấy các phòng có meterReadingDay được thiết lập
 * - Kiểm tra ngày hiện tại >= meterReadingDay
 * - Chưa có hóa đơn cho tháng hiện tại
 * 
 * @returns {Promise<Array>} Danh sách phòng cần chốt số
 */
export async function getMeterReadingReminders() {
    try {
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        // Lấy tất cả phòng có meterReadingDay được thiết lập
        const roomsWithMeterDay = await prisma.room.findMany({
            where: {
                meterReadingDay: {
                    not: null,
                },
                status: 'OCCUPIED', // Chỉ nhắc nhở phòng đang có người thuê
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                    }
                },
                bills: {
                    where: {
                        month: currentMonth,
                        year: currentYear,
                    },
                    select: {
                        id: true,
                    }
                }
            }
        });

        // Lọc các phòng đã đến ngày chốt số nhưng chưa có hóa đơn
        const reminders = roomsWithMeterDay
            .filter(room => {
                // Kiểm tra đã đến ngày chốt số chưa
                const hasReachedMeterDay = currentDay >= room.meterReadingDay;

                // Kiểm tra chưa có hóa đơn tháng này
                const hasNoBillThisMonth = room.bills.length === 0;

                return hasReachedMeterDay && hasNoBillThisMonth;
            })
            .map(room => ({
                roomId: room.id,
                roomCode: room.code,
                roomName: room.name,
                meterReadingDay: room.meterReadingDay,
                tenantName: room.tenant?.fullName || 'Chưa có',
                tenantPhone: room.tenant?.phone || 'Chưa có',
                tenantId: room.tenant?.id || null,
                daysOverdue: currentDay - room.meterReadingDay, // Số ngày đã quá hạn
            }));

        // Sắp xếp theo số ngày quá hạn giảm dần
        reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);

        return reminders;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhắc nhở chốt số:', error);
        throw error;
    }
}
