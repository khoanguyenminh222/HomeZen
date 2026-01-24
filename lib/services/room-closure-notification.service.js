import prisma from '@/lib/prisma';
import { TelegramNotificationService } from './telegram-notification.service.js';
import { formatRoomClosureTelegramMessage } from '../templates/room-closure.template.js';

/**
 * Room Closure Notification Service
 * Phát hiện và gửi thông báo khi phòng tới ngày chốt sổ
 * Requirements: 3.1, 3.4, 8.1, 8.4
 */
export class RoomClosureNotificationService {
  /**
   * Phát hiện các phòng sắp tới ngày chốt sổ và gửi thông báo
   * @param {number} daysBefore - Số ngày trước ngày chốt sổ để thông báo (mặc định 1)
   * @param {string|null} userId - User ID để filter (null = tất cả users, dùng cho Super Admin)
   * @returns {Promise<Object>} Notification results
   */
  static async checkAndNotifyRoomClosures(daysBefore = 1, userId = null) {
    const today = new Date();
    const currentDay = today.getDate();

    // Xây dựng where clause
    const where = {
      status: 'OCCUPIED',
      tenant: {
        isNot: null,
      },
    };

    // Nếu có userId, chỉ lấy phòng của user đó (cho Property Owner)
    if (userId) {
      where.userId = userId;
    }

    // Tìm tất cả các phòng đang có người thuê
    const occupiedRooms = await prisma.room.findMany({
      where,
      include: {
        tenant: {
          include: {
            room: {
              include: {
                user: {
                  include: {
                    propertyInfo: true,
                  },
                },
              },
            },
          },
        },
        user: {
          include: {
            propertyInfo: true,
          },
        },
      },
    });

    // Lọc bỏ các phòng có tenant đã bị xóa (soft delete)
    const validRooms = occupiedRooms.filter(room => 
      room.tenant && !room.tenant.deletedAt
    );

    // Nhóm phòng theo userId và ngày chốt sổ
    const roomsByUserAndDate = {};

    for (const room of validRooms) {
      if (!room.userId || !room.meterReadingDay) {
        continue;
      }

      // Tính ngày chốt sổ trong tháng hiện tại
      const closureDay = room.meterReadingDay;
      
      // Tính số ngày còn lại đến ngày chốt sổ
      let daysRemaining;
      if (currentDay < closureDay) {
        // Ngày chốt sổ còn trong tháng này
        daysRemaining = closureDay - currentDay;
      } else if (currentDay === closureDay) {
        // Hôm nay là ngày chốt sổ
        daysRemaining = 0;
      } else {
        // Ngày chốt sổ đã qua, tính đến ngày chốt sổ tháng sau
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, closureDay);
        const diffTime = nextMonth - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Chỉ thông báo nếu còn đúng số ngày được chỉ định
      if (daysRemaining === daysBefore) {
        const key = `${room.userId}_${closureDay}`;
        
        if (!roomsByUserAndDate[key]) {
          roomsByUserAndDate[key] = {
            userId: room.userId,
            user: room.user,
            propertyInfo: room.user?.propertyInfo,
            closureDay,
            daysRemaining,
            rooms: [],
          };
        }

        roomsByUserAndDate[key].rooms.push({
          roomCode: room.code,
          roomName: room.name,
          tenantName: room.tenant?.fullName || 'Chưa có thông tin',
          tenantPhone: room.tenant?.phone || 'Chưa có thông tin',
          daysRemaining,
        });
      }
    }

    // Gửi thông báo cho từng user
    const results = [];

    for (const key in roomsByUserAndDate) {
      const group = roomsByUserAndDate[key];
      
      try {
        // Tạo message consolidated
        const message = formatRoomClosureTelegramMessage(
          group.propertyInfo?.name || 'Nhà trọ',
          group.rooms,
          group.closureDay,
          group.daysRemaining
        );

        // Gửi telegram notification
        const result = await TelegramNotificationService.sendMessage(
          group.userId,
          message
        );

        results.push({
          userId: group.userId,
          success: result.success,
          roomsCount: group.rooms.length,
          error: result.error,
        });
      } catch (error) {
        console.error(`Error sending room closure notification to user ${group.userId}:`, error);
        results.push({
          userId: group.userId,
          success: false,
          roomsCount: group.rooms.length,
          error: error.message,
        });
      }
    }

    return {
      totalUsers: Object.keys(roomsByUserAndDate).length,
      results,
    };
  }
}
