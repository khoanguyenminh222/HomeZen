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
      return await prisma.bIL_LICH_SU_THAY_DOI.create({
        data: {
          hoa_don_id: billId,
          hoa_don_goc_id: billId, // Lưu billId gốc để query sau khi bill bị xóa
          hanh_dong: action,
          nguoi_thay_doi: changedBy,
          du_lieu_cu: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
          du_lieu_moi: newData ? JSON.parse(JSON.stringify(newData)) : null,
          thay_doi: changes ? JSON.parse(JSON.stringify(changes)) : null,
          mo_ta: description,
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
      const histories = await prisma.bIL_LICH_SU_THAY_DOI.findMany({
        where: {
          hoa_don_id: billId || undefined, // Nếu billId là null, không filter (nhưng trong trường hợp này billId vẫn có giá trị)
        },
        include: {
          nguoi_dung: {
            select: {
              id: true,
              tai_khoan: true,
            },
          },
        },
        orderBy: {
          ngay_tao: 'desc',
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
      thang: bill.thang,
      nam: bill.nam,
      phong_id: bill.phong_id,
      nguoi_dung_id: bill.nguoi_dung_id, // Đảm bảo luôn có userId để filter đúng
      phong: bill.phong ? {
        id: bill.phong.id,
        ma_phong: bill.phong.ma_phong,
        ten_phong: bill.phong.ten_phong,
      } : null,
      chi_so_dien_cu: bill.chi_so_dien_cu,
      chi_so_dien_moi: bill.chi_so_dien_moi,
      tieu_thu_dien: bill.tieu_thu_dien,
      dien_vuot_nguong: bill.dien_vuot_nguong,
      chi_so_nuoc_cu: bill.chi_so_nuoc_cu,
      chi_so_nuoc_moi: bill.chi_so_nuoc_moi,
      tieu_thu_nuoc: bill.tieu_thu_nuoc,
      nuoc_vuot_nguong: bill.nuoc_vuot_nguong,
      anh_dong_ho_dien: bill.anh_dong_ho_dien,
      anh_dong_ho_nuoc: bill.anh_dong_ho_nuoc,
      gia_phong: bill.gia_phong?.toString(),
      tien_dien: bill.tien_dien?.toString(),
      tien_nuoc: bill.tien_nuoc?.toString(),
      tong_tien: bill.tong_tien?.toString(),
      tong_tien_chu: bill.tong_tien_chu,
      da_thanh_toan: bill.da_thanh_toan,
      so_tien_da_tra: bill.so_tien_da_tra?.toString(),
      ngay_thanh_toan: bill.ngay_thanh_toan,
      ghi_chu: bill.ghi_chu,
      ten_nguoi_thue: bill.ten_nguoi_thue,
      sdt_nguoi_thue: bill.sdt_nguoi_thue,
      ngay_sinh_nguoi_thue: bill.ngay_sinh_nguoi_thue,
      can_cuoc_nguoi_thue: bill.can_cuoc_nguoi_thue,
      phi_hoa_don: bill.phi_hoa_don?.map(fee => ({
        id: fee.id,
        ten_phi: fee.ten_phi,
        so_tien: fee.so_tien?.toString(),
        loai_phi_id: fee.loai_phi_id,
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

      // So sánh arrays và objects (chi_phi_hoa_don, phong)
      if (typeof oldValue === 'object' && oldValue !== null && typeof newValue === 'object' && newValue !== null) {
        // Handle Date objects
        if (oldValue instanceof Date && newValue instanceof Date) {
          if (oldValue.getTime() !== newValue.getTime()) {
            changes[key] = { old: oldValue, new: newValue };
          }
        }
        // Handle other objects/arrays via stringify
        else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
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
      TAO_MOI: 'Tạo mới hóa đơn',
      CAP_NHAT: 'Cập nhật hóa đơn',
      XOA: 'Xóa hóa đơn',
      THAY_DOI_TRANG_THAI: 'Thay đổi trạng thái thanh toán',
      THEM_PHI: 'Thêm phí phát sinh',
      XOA_PHI: 'Xóa phí phát sinh',
      CAP_NHAT_PHI: 'Cập nhật phí phát sinh',
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
