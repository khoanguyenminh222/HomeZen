import prisma from '@/lib/prisma';

/**
 * Notification Log Service
 * Quản lý log thông báo
 * Requirements: 3.2, 3.5, 4.4
 */
export async function createNotificationLog(data) {
  try {
    const log = await prisma.nTF_LICH_SU_THONG_BAO.create({
      data: {
        loai: data.loai,
        nguoi_nhan: data.nguoi_nhan,
        tieu_de: data.tieu_de || null,
        noi_dung: data.noi_dung,
        trang_thai: data.trang_thai,
        thong_bao_loi: data.thong_bao_loi || null,
        so_lan_thu_lai: data.so_lan_thu_lai || 0,
        thoi_gian_gui: data.thoi_gian_gui || null,
        nguoi_dung_id: data.nguoi_dung_id || null,
      },
    });

    return log;
  } catch (error) {
    console.error('Error creating notification log:', error);
    // Không throw error để không làm gián đoạn quá trình gửi thông báo
    return null;
  }
}

/**
 * Lấy danh sách notification logs
 * @param {Object} filters - Filters (userId, type, status, limit, offset)
 * @returns {Promise<Array>} Notification logs
 */
export async function getNotificationLogs(filters = {}) {
  const {
    userId,
    type,
    status,
    limit = 50,
    offset = 0,
  } = filters;

  const where = {};

  if (userId) {
    where.nguoi_dung_id = userId;
  }

  if (type) {
    where.loai = type;
  }

  if (status) {
    where.trang_thai = status;
  }

  const logs = await prisma.nTF_LICH_SU_THONG_BAO.findMany({
    where,
    orderBy: {
      ngay_tao: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return logs;
}
