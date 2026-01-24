import prisma from '@/lib/prisma';

/**
 * Service để quản lý lịch sử thay đổi hóa đơn
 */
export class BillHistoryService {
  /**
   * Lưu lịch sử thay đổi hóa đơn
   * @param {Object} params
   * @param {string} params.billId - ID của hóa đơn
   * @param {string} params.action - Hành động (CREATE, UPDATE, DELETE, etc.)
   * @param {string|null} params.changedBy - User ID người thực hiện
   * @param {Object|null} params.oldData - Dữ liệu cũ (snapshot)
   * @param {Object|null} params.newData - Dữ liệu mới (snapshot)
   * @param {Object|null} params.changes - Mô tả chi tiết các thay đổi
   * @param {string|null} params.description - Mô tả thay đổi
   */
  static async createHistory({
    billId,
    action,
    changedBy = null,
    oldData = null,
    newData = null,
    changes = null,
    description = null,
  }) {
    if (!billId) {
      console.error('createHistory: billId is required');
      return null;
    }

    try {
      return await prisma.billHistory.create({
        data: {
          billId,
          originalBillId: billId, // Lưu billId gốc để query sau khi bill bị xóa
          action,
          changedBy,
          oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
          changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
          description,
        },
      });
    } catch (error) {
      console.error('Error creating bill history:', error);
      // Không throw error để không làm gián đoạn flow chính
      return null;
    }
  }

  /**
   * Lấy lịch sử thay đổi của một hóa đơn
   * @param {string} billId - ID của hóa đơn
   * @param {Object} options - Tùy chọn
   * @param {number} options.limit - Số lượng bản ghi tối đa
   * @param {number} options.skip - Số lượng bản ghi bỏ qua
   */
  static async getHistory(billId, options = {}) {
    const { limit = 100, skip = 0 } = options;

    try {
      // Tìm lịch sử với billId (có thể bill đã bị xóa, billId có thể là null)
      // Nhưng khi query, ta vẫn dùng billId để tìm các record có billId này
      // (kể cả khi bill đã bị xóa, billId vẫn giữ giá trị trong BillHistory)
      const histories = await prisma.billHistory.findMany({
        where: { 
          billId: billId || undefined, // Nếu billId là null, không filter (nhưng trong trường hợp này billId vẫn có giá trị)
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip,
      });

      return histories;
    } catch (error) {
      console.error('Error fetching bill history:', error);
      throw error;
    }
  }

  /**
   * Tạo snapshot của hóa đơn để lưu vào lịch sử
   * @param {Object} bill - Bill object từ Prisma
   */
  static createBillSnapshot(bill) {
    if (!bill) return null;

    return {
      id: bill.id,
      month: bill.month,
      year: bill.year,
      roomId: bill.roomId,
      userId: bill.userId, // Đảm bảo luôn có userId để filter đúng
      room: bill.room ? {
        id: bill.room.id,
        code: bill.room.code,
        name: bill.room.name,
      } : null,
      oldElectricReading: bill.oldElectricReading,
      newElectricReading: bill.newElectricReading,
      electricityUsage: bill.electricityUsage,
      electricityRollover: bill.electricityRollover,
      oldWaterReading: bill.oldWaterReading,
      newWaterReading: bill.newWaterReading,
      waterUsage: bill.waterUsage,
      waterRollover: bill.waterRollover,
      electricMeterPhotoUrl: bill.electricMeterPhotoUrl,
      waterMeterPhotoUrl: bill.waterMeterPhotoUrl,
      roomPrice: bill.roomPrice?.toString(),
      electricityCost: bill.electricityCost?.toString(),
      waterCost: bill.waterCost?.toString(),
      totalCost: bill.totalCost?.toString(),
      totalCostText: bill.totalCostText,
      isPaid: bill.isPaid,
      paidAmount: bill.paidAmount?.toString(),
      paidDate: bill.paidDate,
      notes: bill.notes,
      tenantName: bill.tenantName,
      tenantPhone: bill.tenantPhone,
      tenantDateOfBirth: bill.tenantDateOfBirth,
      tenantIdCard: bill.tenantIdCard,
      billFees: bill.billFees?.map(fee => ({
        id: fee.id,
        name: fee.name,
        amount: fee.amount?.toString(),
        feeTypeId: fee.feeTypeId,
      })) || [],
    };
  }

  /**
   * So sánh 2 snapshot và tạo mô tả thay đổi
   * @param {Object} oldSnapshot - Snapshot cũ
   * @param {Object} newSnapshot - Snapshot mới
   */
  static compareSnapshots(oldSnapshot, newSnapshot) {
    if (!oldSnapshot && !newSnapshot) return null;
    if (!oldSnapshot) return { type: 'created', fields: Object.keys(newSnapshot) };
    if (!newSnapshot) return { type: 'deleted', fields: Object.keys(oldSnapshot) };

    const changes = {};
    const allKeys = new Set([...Object.keys(oldSnapshot), ...Object.keys(newSnapshot)]);

    for (const key of allKeys) {
      const oldValue = oldSnapshot[key];
      const newValue = newSnapshot[key];

      // So sánh arrays (billFees)
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = {
            old: oldValue,
            new: newValue,
          };
        }
      } else if (oldValue !== newValue) {
        changes[key] = {
          old: oldValue,
          new: newValue,
        };
      }
    }

    return Object.keys(changes).length > 0 ? { type: 'updated', fields: changes } : null;
  }

  /**
   * Tạo mô tả thay đổi dạng text
   * @param {string} action - Hành động
   * @param {Object} changes - Object mô tả thay đổi
   */
  static generateDescription(action, changes) {
    const actionMap = {
      CREATE: 'Tạo mới hóa đơn',
      UPDATE: 'Cập nhật hóa đơn',
      DELETE: 'Xóa hóa đơn',
      STATUS_CHANGE: 'Thay đổi trạng thái thanh toán',
      FEE_ADD: 'Thêm phí phát sinh',
      FEE_REMOVE: 'Xóa phí phát sinh',
      FEE_UPDATE: 'Cập nhật phí phát sinh',
    };

    let description = actionMap[action] || 'Thay đổi hóa đơn';

    if (changes && changes.fields) {
      const fieldNames = Object.keys(changes.fields);
      if (fieldNames.length > 0) {
        description += `: ${fieldNames.join(', ')}`;
      }
    }

    return description;
  }
}
