import prisma from '@/lib/prisma';

/**
 * Lấy đơn giá điện nước cho phòng (ưu tiên riêng, sau đó chung)
 * 
 * @param {string} roomId - ID phòng
 * @returns {Promise<Object>} - UtilityRate với tieredRates
 */
export async function getUtilityRateForRoom(phong_id) {
  // Tìm đơn giá riêng của phòng
  const roomRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
    where: { phong_id },
    include: {
      bac_thang_gia: {
        orderBy: { muc_tieu_thu_min: 'asc' }
      }
    }
  });

  if (roomRate) {
    return roomRate;
  }

  // Nếu không có riêng, lấy đơn giá chung
  const globalRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findFirst({
    where: { la_chung: true },
    include: {
      bac_thang_gia: {
        orderBy: { muc_tieu_thu_min: 'asc' }
      }
    }
  });

  if (!globalRate) {
    throw new Error('Chưa cấu hình đơn giá điện nước');
  }

  return globalRate;
}
