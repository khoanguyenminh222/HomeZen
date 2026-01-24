/**
 * Room Closure Notification Templates
 * Templates cho thông báo chốt sổ phòng (chỉ Telegram)
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * Format telegram message cho room closure notification
 * @param {string} propertyName - Tên nhà trọ
 * @param {Array} rooms - Danh sách phòng sắp chốt sổ
 * @param {number} closureDay - Ngày chốt sổ
 * @param {number} daysRemaining - Số ngày còn lại
 * @returns {string} Formatted telegram message
 */
export function formatRoomClosureTelegramMessage(propertyName, rooms, closureDay, daysRemaining) {
  const emoji = daysRemaining === 0 ? '🔴' : '⚠️';
  const title = daysRemaining === 0 
    ? 'THÔNG BÁO CHỐT SỔ HÔM NAY'
    : `THÔNG BÁO CHỐT SỔ CÒN ${daysRemaining} NGÀY`;

  let message = `${emoji} <b>${title}</b>\n\n`;
  message += `🏠 <b>Nhà trọ:</b> ${propertyName}\n`;
  message += `📅 <b>Ngày chốt sổ:</b> ${closureDay} hàng tháng\n\n`;

  if (rooms.length === 1) {
    const room = rooms[0];
    message += `📋 <b>Thông tin phòng:</b>\n`;
    message += `   • Phòng: <b>${room.roomCode}</b> - ${room.roomName}\n`;
    message += `   • Người thuê: ${room.tenantName}\n`;
    message += `   • SĐT: ${room.tenantPhone}\n`;
  } else {
    message += `📋 <b>Danh sách phòng cần chốt sổ (${rooms.length} phòng):</b>\n\n`;
    
    rooms.forEach((room, index) => {
      message += `${index + 1}. <b>${room.roomCode}</b> - ${room.roomName}\n`;
      message += `   👤 ${room.tenantName} | 📞 ${room.tenantPhone}\n`;
      if (index < rooms.length - 1) {
        message += `\n`;
      }
    });
  }

  message += `\n💡 <i>Vui lòng chuẩn bị chốt số đồng hồ điện nước cho các phòng trên.</i>`;

  return message;
}
