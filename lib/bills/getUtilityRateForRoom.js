import prisma from '@/lib/prisma';

/**
 * Lấy đơn giá điện nước cho phòng (ưu tiên riêng, sau đó chung)
 * 
 * @param {string} roomId - ID phòng
 * @returns {Promise<Object>} - UtilityRate với tieredRates
 */
export async function getUtilityRateForRoom(roomId) {
  // Tìm đơn giá riêng của phòng
  const roomRate = await prisma.utilityRate.findUnique({
    where: { roomId },
    include: {
      tieredRates: {
        orderBy: { minUsage: 'asc' }
      }
    }
  });

  if (roomRate) {
    return roomRate;
  }

  // Nếu không có riêng, lấy đơn giá chung
  const globalRate = await prisma.utilityRate.findFirst({
    where: { isGlobal: true },
    include: {
      tieredRates: {
        orderBy: { minUsage: 'asc' }
      }
    }
  });

  if (!globalRate) {
    throw new Error('Chưa cấu hình đơn giá điện nước');
  }

  return globalRate;
}
