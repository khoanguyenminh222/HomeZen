import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

/**
 * Super Admin Service
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2
 */
export class SuperAdminService {
  /**
   * Create a new property owner account with property information
   * Requirements: 1.1, 1.2, 2.1, 2.2
   * 
   * @param {Object} data - Property owner data
   * @param {string} data.tai_khoan - Username (must be unique)
   * @param {string} data.mat_khau - Plain text password
   * @param {string} data.ten - Property name (required)
   * @param {string} data.dia_chi - Property address (required)
   * @param {string} data.dien_thoai - Phone number
   * @param {string} data.ten_chu_nha - Owner name
   * @param {string} data.email - Email (optional)
   * @param {string} data.logo_url - Logo URL (optional)
   * @param {number} data.max_dong_ho_dien - Max electric meter value
   * @param {number} data.max_dong_ho_nuoc - Max water meter value
   * @returns {Promise<Object>} Created user
   */
  static async createPropertyOwner({
    tai_khoan,
    mat_khau,
    ten,
    dia_chi,
    dien_thoai,
    ten_chu_nha,
    email,
    logo_url,
    max_dong_ho_dien,
    max_dong_ho_nuoc
  }) {
    // Validate tai_khoan
    if (!tai_khoan || tai_khoan.trim().length === 0) {
      throw new Error('Username is required');
    }
    if (tai_khoan.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (tai_khoan.length > 50) {
      throw new Error('Username must not exceed 50 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(tai_khoan)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // Validate mat_khau
    if (!mat_khau || mat_khau.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if username already exists
    const existingUser = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { tai_khoan: tai_khoan }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Validate required property fields
    if (!ten || ten.trim().length === 0) {
      throw new Error('Property name is required');
    }
    if (ten.length > 200) {
      throw new Error('Property name must not exceed 200 characters');
    }

    if (!dia_chi || dia_chi.trim().length === 0) {
      throw new Error('Property address is required');
    }
    if (dia_chi.length > 500) {
      throw new Error('Property address must not exceed 500 characters');
    }

    // Validate phone if provided
    if (dien_thoai && !/^(0|\+84)[0-9]{9,10}$/.test(dien_thoai)) {
      throw new Error('Phone number is invalid (must be 10-11 digits)');
    }

    // Validate email if provided
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email is invalid');
      }
    }

    // Validate max meter values
    if (max_dong_ho_dien !== undefined) {
      if (!Number.isInteger(max_dong_ho_dien) || max_dong_ho_dien < 9999 || max_dong_ho_dien > 9999999) {
        throw new Error('Max electric meter must be between 9999 and 9999999');
      }
    }

    if (max_dong_ho_nuoc !== undefined) {
      if (!Number.isInteger(max_dong_ho_nuoc) || max_dong_ho_nuoc < 9999 || max_dong_ho_nuoc > 9999999) {
        throw new Error('Max water meter must be between 9999 and 9999999');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(mat_khau);

    // Create user with CHU_NHA_TRO role and PropertyInfo
    const user = await prisma.uSR_NGUOI_DUNG.create({
      data: {
        tai_khoan: tai_khoan,
        mat_khau: hashedPassword,
        vai_tro: 'CHU_NHA_TRO',
        trang_thai: true,
        thong_tin_nha_tro: {
          create: {
            ten: ten,
            dia_chi: dia_chi,
            dien_thoai: dien_thoai || '',
            ten_chu_nha: ten_chu_nha || '',
            email: email || null,
            logo_url: logo_url || null,
            max_dong_ho_dien: max_dong_ho_dien || 999999,
            max_dong_ho_nuoc: max_dong_ho_nuoc || 99999,
          }
        }
      },
      include: {
        thong_tin_nha_tro: true
      }
    });

    // Create default global utility rates
    await prisma.pRP_DON_GIA_DIEN_NUOC.create({
      data: {
        nguoi_dung_id: user.id,
        gia_dien: 3500,
        gia_nuoc: 15000,
        phuong_thuc_tinh_nuoc: 'DONG_HO',
        la_chung: true,
      }
    });

    // Remove password from response
    const { mat_khau: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * List all property owners with their property information
   * Requirements: 1.1, 1.3
   * 
   * @returns {Promise<Array>} List of property owners
   */
  static async listPropertyOwners() {
    const users = await prisma.uSR_NGUOI_DUNG.findMany({
      where: {
        vai_tro: 'CHU_NHA_TRO'
      },
      select: {
        id: true,
        tai_khoan: true,
        vai_tro: true,
        trang_thai: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        thong_tin_nha_tro: true,
        _count: {
          select: {
            phong: true,
            loai_phi: true,
            don_gia_dien_nuoc: true,
          }
        }
      },
      orderBy: {
        ngay_tao: 'desc'
      }
    });

    return users;
  }

  /**
   * Deactivate a property owner account
   * Requirements: 1.4
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  static async deactivatePropertyOwner(userId) {
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.vai_tro === 'SIEU_QUAN_TRI') {
      throw new Error('Cannot deactivate Super Admin');
    }

    const updatedUser = await prisma.uSR_NGUOI_DUNG.update({
      where: { id: userId },
      data: {
        trang_thai: false
      },
      select: {
        id: true,
        tai_khoan: true,
        vai_tro: true,
        trang_thai: true,
        ngay_cap_nhat: true,
      }
    });

    return updatedUser;
  }

  /**
   * Activate a property owner account
   * Requirements: 1.4
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  static async activatePropertyOwner(userId) {
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.uSR_NGUOI_DUNG.update({
      where: { id: userId },
      data: {
        trang_thai: true
      },
      select: {
        id: true,
        tai_khoan: true,
        vai_tro: true,
        trang_thai: true,
        ngay_cap_nhat: true,
      }
    });

    return updatedUser;
  }

  /**
   * Update property information for a property owner
   * Requirements: 2.2, 2.6
   * 
   * @param {string} userId - User ID
   * @param {Object} data - Property data to update
   * @returns {Promise<Object>} Updated property info
   */
  static async updatePropertyInfo(userId, data) {
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId },
      include: { thong_tin_nha_tro: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.vai_tro !== 'CHU_NHA_TRO') {
      throw new Error('User is not a Property Owner');
    }

    // Update or create PropertyInfo
    let propertyInfo;
    if (user.thong_tin_nha_tro) {
      // Update existing PropertyInfo
      propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.update({
        where: { id: user.thong_tin_nha_tro.id },
        data: {
          ten: data.ten !== undefined ? data.ten : user.thong_tin_nha_tro.ten,
          dia_chi: data.dia_chi !== undefined ? data.dia_chi : user.thong_tin_nha_tro.dia_chi,
          dien_thoai: data.dien_thoai !== undefined ? data.dien_thoai : user.thong_tin_nha_tro.dien_thoai,
          ten_chu_nha: data.ten_chu_nha !== undefined ? data.ten_chu_nha : user.thong_tin_nha_tro.ten_chu_nha,
          email: data.email !== undefined ? data.email : user.thong_tin_nha_tro.email,
          logo_url: data.logo_url !== undefined ? data.logo_url : user.thong_tin_nha_tro.logo_url,
          max_dong_ho_dien: data.max_dong_ho_dien !== undefined ? data.max_dong_ho_dien : user.thong_tin_nha_tro.max_dong_ho_dien,
          max_dong_ho_nuoc: data.max_dong_ho_nuoc !== undefined ? data.max_dong_ho_nuoc : user.thong_tin_nha_tro.max_dong_ho_nuoc,
        }
      });
    } else {
      // Create new PropertyInfo if doesn't exist
      if (!data.ten || !data.dia_chi) {
        throw new Error('Property name and address are required');
      }
      propertyInfo = await prisma.pRP_THONG_TIN_NHA_TRO.create({
        data: {
          nguoi_dung_id: userId,
          ten: data.ten,
          dia_chi: data.dia_chi,
          dien_thoai: data.dien_thoai || '',
          ten_chu_nha: data.ten_chu_nha || '',
          email: data.email || null,
          logo_url: data.logo_url || null,
          max_dong_ho_dien: data.max_dong_ho_dien || 999999,
          max_dong_ho_nuoc: data.max_dong_ho_nuoc || 99999,
        }
      });
    }

    return {
      userId,
      tai_khoan: user.tai_khoan,
      vai_tro: user.vai_tro,
      propertyInfo,
      updatedAt: propertyInfo.ngay_cap_nhat,
    };
  }

  /**
   * Transfer property ownership between owners
   * Requirements: 2.6
   * 
   * @param {string} fromUserId - Current owner user ID
   * @param {string} toUserId - New owner user ID
   * @returns {Promise<Object>} Transfer result
   */
  static async transferPropertyOwnership(fromUserId, toUserId) {
    // Get source user with property info
    const fromUser = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: fromUserId },
      include: { thong_tin_nha_tro: true }
    });

    if (!fromUser || fromUser.vai_tro !== 'CHU_NHA_TRO') {
      throw new Error('Source user is not a Property Owner');
    }

    if (!fromUser.thong_tin_nha_tro) {
      throw new Error('Source user does not have property information');
    }

    // Get target user
    const toUser = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: toUserId },
      include: { thong_tin_nha_tro: true }
    });

    if (!toUser || toUser.vai_tro !== 'CHU_NHA_TRO') {
      throw new Error('Target user is not a Property Owner');
    }

    // Check if target user already has property
    if (toUser.thong_tin_nha_tro) {
      throw new Error('Target user already has a property assigned');
    }

    // Transfer property info and all related data
    return await prisma.$transaction(async (tx) => {
      // 1. Update PropertyInfo to point to target user
      await tx.pRP_THONG_TIN_NHA_TRO.update({
        where: { id: fromUser.thong_tin_nha_tro.id },
        data: {
          nguoi_dung_id: toUserId,
          ten: fromUser.thong_tin_nha_tro.ten,
          dia_chi: fromUser.thong_tin_nha_tro.dia_chi,
          dien_thoai: fromUser.thong_tin_nha_tro.dien_thoai,
          ten_chu_nha: fromUser.thong_tin_nha_tro.ten_chu_nha,
          email: fromUser.thong_tin_nha_tro.email,
          logo_url: fromUser.thong_tin_nha_tro.logo_url,
          max_dong_ho_dien: fromUser.thong_tin_nha_tro.max_dong_ho_dien,
          max_dong_ho_nuoc: fromUser.thong_tin_nha_tro.max_dong_ho_nuoc,
        }
      });

      // 2. Transfer all rooms
      await tx.pRP_PHONG.updateMany({
        where: { nguoi_dung_id: fromUserId },
        data: { nguoi_dung_id: toUserId }
      });

      // 3. Transfer all fee types
      await tx.bIL_LOAI_PHI.updateMany({
        where: { nguoi_dung_id: fromUserId },
        data: { nguoi_dung_id: toUserId }
      });

      // 4. Transfer all utility rates
      await tx.pRP_DON_GIA_DIEN_NUOC.updateMany({
        where: { nguoi_dung_id: fromUserId },
        data: { nguoi_dung_id: toUserId }
      });

      return { success: true, message: 'Property ownership transferred successfully' };
    });
  }

  /**
   * Get system statistics
   * Requirements: 1.3
   * 
   * @returns {Promise<Object>} System statistics
   */
  static async getSystemStats() {
    const [
      totalUsers,
      totalPropertyOwners,
      activePropertyOwners,
      totalProperties,
      totalRooms,
      totalTenants,
      totalBills
    ] = await Promise.all([
      prisma.uSR_NGUOI_DUNG.count(),
      prisma.uSR_NGUOI_DUNG.count({ where: { vai_tro: 'CHU_NHA_TRO' } }),
      prisma.uSR_NGUOI_DUNG.count({ where: { vai_tro: 'CHU_NHA_TRO', trang_thai: true } }),
      prisma.pRP_THONG_TIN_NHA_TRO.count(),
      prisma.pRP_PHONG.count(),
      prisma.tNT_NGUOI_THUE_CHINH.count({ where: { ngay_xoa: null } }),
      prisma.bIL_HOA_DON.count(),
    ]);

    return {
      totalUsers,
      totalPropertyOwners,
      activePropertyOwners,
      inactivePropertyOwners: totalPropertyOwners - activePropertyOwners,
      totalProperties,
      totalRooms,
      totalTenants,
      totalBills,
    };
  }

  /**
   * List all properties (from PropertyInfo model)
   * Requirements: 1.3, 2.1
   * 
   * @returns {Promise<Array>} List of properties with owner info
   */
  static async listProperties() {
    const properties = await prisma.pRP_THONG_TIN_NHA_TRO.findMany({
      include: {
        nguoi_dung: {
          select: {
            id: true,
            tai_khoan: true,
            vai_tro: true,
            trang_thai: true,
            ngay_tao: true,
            ngay_cap_nhat: true,
            _count: {
              select: {
                phong: true,
                loai_phi: true,
                don_gia_dien_nuoc: true,
              }
            }
          }
        }
      },
      orderBy: {
        ngay_tao: 'desc'
      }
    });

    return properties;
  }
}
