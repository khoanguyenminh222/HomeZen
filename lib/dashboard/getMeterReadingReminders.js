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
        const roomsWithMeterDay = await prisma.pRP_PHONG.findMany({
            where: {
                ngay_chot_so: {
                    not: null,
                },
                trang_thai: 'DA_THUE', // Chỉ nhắc nhở phòng đang có người thuê
            },
            include: {
                nguoi_thue: {
                    select: {
                        id: true,
                        ho_ten: true,
                        dien_thoai: true,
                    }
                },
                hoa_don: {
                    where: {
                        thang: currentMonth,
                        nam: currentYear,
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
                const hasReachedMeterDay = currentDay >= room.ngay_chot_so;

                // Kiểm tra chưa có hóa đơn tháng này
                const hasNoBillThisMonth = room.hoa_don.length === 0;

                return hasReachedMeterDay && hasNoBillThisMonth;
            })
            .map(room => ({
                roomId: room.id,
                roomCode: room.ma_phong,
                roomName: room.ten_phong,
                meterReadingDay: room.ngay_chot_so,
                tenantName: room.nguoi_thue?.ho_ten || 'Chưa có',
                tenantPhone: room.nguoi_thue?.dien_thoai || 'Chưa có',
                tenantId: room.nguoi_thue?.id || null,
                daysOverdue: currentDay - room.ngay_chot_so, // Số ngày đã quá hạn
            }));

        // Sắp xếp theo số ngày quá hạn giảm dần
        reminders.sort((a, b) => b.daysOverdue - a.daysOverdue);

        return reminders;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhắc nhở chốt số:', error);
        throw error;
    }
}
