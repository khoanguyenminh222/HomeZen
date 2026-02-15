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
      trang_thai: 'DA_THUE',
      nguoi_thue: {
        isNot: null,
      },
    };

    // Nếu có userId, chỉ lấy phòng của user đó (cho Property Owner)
    if (userId) {
      where.nguoi_dung_id = userId;
    }

    // Tìm tất cả các phòng đang có người thuê
    const occupiedRooms = await prisma.pRP_PHONG.findMany({
      where,
      include: {
        nguoi_thue: {
          include: {
            phong: {
              include: {
                nguoi_dung: {
                  include: {
                    thong_tin_nha_tro: true,
                  },
                },
              },
            },
          },
        },
        nguoi_dung: {
          include: {
            thong_tin_nha_tro: true,
          },
        },
      },
    });

    // Lọc bỏ các phòng có tenant đã bị xóa (soft delete)
    const validRooms = occupiedRooms.filter(room =>
      room.nguoi_thue && !room.nguoi_thue.ngay_xoa
    );

    // Nhóm phòng theo userId và ngày chốt sổ
    const roomsByUserAndDate = {};

    for (const room of validRooms) {
      if (!room.nguoi_dung_id || !room.ngay_chot_so) {
        continue;
      }

      // Tính ngày chốt sổ trong tháng hiện tại
      const closureDay = room.ngay_chot_so;

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
        const key = `${room.nguoi_dung_id}_${closureDay}`;

        if (!roomsByUserAndDate[key]) {
          roomsByUserAndDate[key] = {
            nguoi_dung_id: room.nguoi_dung_id,
            user: room.nguoi_dung,
            thong_tin_nha_tro: room.nguoi_dung?.thong_tin_nha_tro,
            ngay_chot_so: closureDay,
            so_ngay_con_lai: daysRemaining,
            danh_sach_phong: [],
          };
        }

        roomsByUserAndDate[key].danh_sach_phong.push({
          ma_phong: room.ma_phong,
          ten_phong: room.ten_phong,
          ten_nguoi_thue: room.nguoi_thue?.ho_ten || 'Chưa có thông tin',
          so_dien_thoai_nguoi_thue: room.nguoi_thue?.dien_thoai || 'Chưa có thông tin',
          so_ngay_con_lai: daysRemaining,
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
          group.thong_tin_nha_tro?.ten || 'Nhà trọ',
          group.danh_sach_phong,
          group.ngay_chot_so,
          group.so_ngay_con_lai
        );

        // Gửi telegram notification
        const result = await TelegramNotificationService.sendMessage(
          group.nguoi_dung_id,
          message
        );

        results.push({
          nguoi_dung_id: group.nguoi_dung_id,
          ten_chu_tro: group.thong_tin_nha_tro?.ten_chu_nha || group.user?.tai_khoan || 'Chưa rõ',
          success: result.success,
          so_phong: group.danh_sach_phong.length,
          error: result.error,
        });
      } catch (error) {
        console.error(`Error sending room closure notification to user ${group.nguoi_dung_id}:`, error);
        results.push({
          nguoi_dung_id: group.nguoi_dung_id,
          ten_chu_tro: group.thong_tin_nha_tro?.ten_chu_nha || group.user?.tai_khoan || 'Chưa rõ',
          success: false,
          so_phong: group.danh_sach_phong.length,
          error: error.message,
        });
      }
    }

    return {
      tong_so_chu_tro: Object.keys(roomsByUserAndDate).length,
      results,
    };
  }
}
