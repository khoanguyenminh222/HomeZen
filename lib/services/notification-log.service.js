import prisma from '@/lib/prisma';

/**
 * Notification Log Service
 * Quản lý log thông báo
 * Requirements: 3.2, 3.5, 4.4
 */
export async function createNotificationLog(data) {
  try {
    const log = await prisma.notificationLog.create({
      data: {
        type: data.type,
        recipient: data.recipient,
        subject: data.subject || null,
        message: data.message,
        status: data.status,
        errorMessage: data.errorMessage || null,
        retryCount: data.retryCount || 0,
        sentAt: data.sentAt || null,
        userId: data.userId || null,
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
    where.userId = userId;
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  const logs = await prisma.notificationLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return logs;
}
