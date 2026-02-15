import prisma from '@/lib/prisma';

/**
 * Property Owner Service
 * Requirements: 2.1, 2.2, 5.1, 5.2, 5.4
 */
export class PropertyOwnerService {
  /**
   * Get property information for user
   * Requirements: 2.1, 2.4
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Property information
   */
  static async getMyProperty(userId) {
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId },
      include: {
        thong_tin_nha_tro: true,
        _count: {
          select: {
            phong: true,
            loai_phi: true,
            don_gia_dien_nuoc: true,
          }
        }
      }
    });

    if (!user || !user.thong_tin_nha_tro) {
      return null;
    }

    return {
      id: user.id,
      username: user.tai_khoan,
      propertyInfo: user.thong_tin_nha_tro,
      _count: user._count
    };
  }

  /**
   * Get rooms for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of rooms
   */
  static async getMyRooms(userId, filters = {}) {
    const where = {
      nguoi_dung_id: userId,
      ...filters
    };

    const rooms = await prisma.pRP_PHONG.findMany({
      where,
      include: {
        nguoi_dung: {
          select: {
            id: true,
            thong_tin_nha_tro: {
              select: {
                ten: true,
              }
            },
          }
        },
        nguoi_thue: {
          select: {
            id: true,
            ho_ten: true,
            dien_thoai: true,
          }
        },
        _count: {
          select: {
            hoa_don: true,
          }
        }
      },
      orderBy: {
        ma_phong: 'asc'
      }
    });

    return rooms;
  }

  /**
   * Get tenants for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of tenants
   */
  static async getMyTenants(userId, filters = {}) {
    const where = {
      phong: {
        nguoi_dung_id: userId
      },
      ngay_xoa: null,
      ...filters
    };

    const tenants = await prisma.tNT_NGUOI_THUE_CHINH.findMany({
      where,
      include: {
        phong: {
          include: {
            nguoi_dung: {
              select: {
                id: true,
                thong_tin_nha_tro: {
                  select: {
                    ten: true,
                  }
                },
              }
            }
          }
        },
        nguoi_o: true,
      },
      orderBy: {
        ngay_tao: 'desc'
      }
    });

    return tenants;
  }

  /**
   * Get fee types for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of fee types
   */
  static async getMyFeeTypes(userId, filters = {}) {
    const where = {
      nguoi_dung_id: userId,
      ...filters
    };

    const feeTypes = await prisma.bIL_LOAI_PHI.findMany({
      where,
      include: {
        nguoi_dung: {
          select: {
            id: true,
            thong_tin_nha_tro: {
              select: {
                ten: true,
              }
            },
          }
        },
        _count: {
          select: {
            phi_phong: true,
          }
        }
      },
      orderBy: {
        ten_phi: 'asc'
      }
    });

    return feeTypes;
  }

  /**
   * Get utility rates for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of utility rates
   */
  static async getMyUtilityRates(userId, filters = {}) {
    const where = {
      nguoi_dung_id: userId,
      ...filters
    };

    const utilityRates = await prisma.pRP_DON_GIA_DIEN_NUOC.findMany({
      where,
      include: {
        nguoi_dung: {
          select: {
            id: true,
            thong_tin_nha_tro: {
              select: {
                ten: true,
              }
            },
          }
        },
        phong: {
          select: {
            id: true,
            ma_phong: true,
            ten_phong: true,
          }
        },
        bac_thang_gia: {
          orderBy: {
            muc_tieu_thu_min: 'asc'
          }
        }
      },
      orderBy: {
        ngay_tao: 'desc'
      }
    });

    return utilityRates;
  }

  /**
   * Get bills for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of bills
   */
  static async getMyBills(userId, filters = {}) {
    const where = {
      phong: {
        nguoi_dung_id: userId
      },
      ...filters
    };

    const bills = await prisma.bIL_HOA_DON.findMany({
      where,
      include: {
        phong: {
          include: {
            nguoi_dung: {
              select: {
                id: true,
                thong_tin_nha_tro: {
                  select: {
                    ten: true,
                  }
                },
              }
            }
          }
        },
        phi_hoa_don: true,
      },
      orderBy: {
        nam: 'desc',
        thang: 'desc'
      }
    });

    return bills;
  }

  /**
   * Get dashboard stats for user's property
   * Requirements: 5.4, 5.5
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboard statistics
   */
  static async getMyDashboardStats(userId) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [
      totalRooms,
      emptyRooms,
      occupiedRooms,
      totalTenants,
      currentMonthBills
    ] = await Promise.all([
      prisma.pRP_PHONG.count({
        where: { nguoi_dung_id: userId }
      }),
      prisma.pRP_PHONG.count({
        where: { nguoi_dung_id: userId, trang_thai: 'TRONG' }
      }),
      prisma.pRP_PHONG.count({
        where: { nguoi_dung_id: userId, trang_thai: 'DA_THUE' }
      }),
      prisma.tNT_NGUOI_THUE_CHINH.count({
        where: {
          phong: {
            nguoi_dung_id: userId
          },
          ngay_xoa: null
        }
      }),
      prisma.bIL_HOA_DON.findMany({
        where: {
          phong: {
            nguoi_dung_id: userId
          },
          thang: currentMonth,
          nam: currentYear,
        },
        select: {
          tong_tien: true,
          da_thanh_toan: true,
          so_tien_da_tra: true,
        }
      })
    ]);

    const unpaidBills = currentMonthBills.filter(bill => !bill.da_thanh_toan);
    const unpaidBillsCount = unpaidBills.length;
    const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => {
      return sum + Number(bill.tong_tien);
    }, 0);

    const paidBills = currentMonthBills.filter(bill => bill.da_thanh_toan);
    const currentMonthRevenue = paidBills.reduce((sum, bill) => {
      return sum + (Number(bill.so_tien_da_tra) || Number(bill.tong_tien));
    }, 0);

    return {
      totalRooms,
      emptyRooms,
      occupiedRooms,
      totalTenants,
      currentMonthRevenue,
      unpaidBillsCount,
      totalUnpaidAmount,
    };
  }
}
