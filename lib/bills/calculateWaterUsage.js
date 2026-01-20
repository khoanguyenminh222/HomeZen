/**
 * Tính nước tiêu thụ và phát hiện xoay vòng đồng hồ
 * 
 * @param {number} oldReading - Chỉ số cũ
 * @param {number} newReading - Chỉ số mới
 * @param {number} maxMeter - Giá trị tối đa đồng hồ (từ PropertyInfo hoặc Room)
 * @returns {{usage: number, rollover: boolean}} - Tiêu thụ và có xoay vòng không
 */
export function calculateWaterUsage(oldReading, newReading, maxMeter = 99999) {
  if (oldReading < 0 || newReading < 0) {
    throw new Error('Chỉ số đồng hồ không được âm');
  }

  if (oldReading > maxMeter || newReading > maxMeter) {
    throw new Error(`Chỉ số đồng hồ không được vượt quá ${maxMeter}`);
  }

  // Phát hiện xoay vòng: chỉ số mới nhỏ hơn chỉ số cũ
  const rollover = newReading < oldReading;

  if (rollover) {
    // Tính tiêu thụ khi xoay vòng
    // Ví dụ: cũ = 99990, mới = 10 => tiêu thụ = (maxMeter - oldReading) + newReading
    const usage = (maxMeter - oldReading) + newReading + 1; // +1 vì đếm từ 0
    return { usage, rollover: true };
  } else {
    // Tính tiêu thụ bình thường
    const usage = newReading - oldReading;
    return { usage, rollover: false };
  }
}
