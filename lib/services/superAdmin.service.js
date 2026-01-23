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
   * @param {string} data.username - Username (must be unique)
   * @param {string} data.password - Plain text password
   * @param {string} data.propertyName - Property name (required)
   * @param {string} data.propertyAddress - Property address (required)
   * @param {string} data.phone - Phone number
   * @param {string} data.ownerName - Owner name
   * @param {string} data.email - Email (optional)
   * @param {string} data.logoUrl - Logo URL (optional)
   * @param {number} data.maxElectricMeter - Max electric meter value
   * @param {number} data.maxWaterMeter - Max water meter value
   * @returns {Promise<Object>} Created user
   */
  static async createPropertyOwner({ 
    username, 
    password, 
    propertyName, 
    propertyAddress, 
    phone, 
    ownerName, 
    email, 
    logoUrl, 
    maxElectricMeter, 
    maxWaterMeter 
  }) {
    // Validate username
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }
    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (username.length > 50) {
      throw new Error('Username must not exceed 50 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Validate required property fields
    if (!propertyName || propertyName.trim().length === 0) {
      throw new Error('Property name is required');
    }
    if (propertyName.length > 200) {
      throw new Error('Property name must not exceed 200 characters');
    }

    if (!propertyAddress || propertyAddress.trim().length === 0) {
      throw new Error('Property address is required');
    }
    if (propertyAddress.length > 500) {
      throw new Error('Property address must not exceed 500 characters');
    }

    // Validate phone if provided
    if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
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
    if (maxElectricMeter !== undefined) {
      if (!Number.isInteger(maxElectricMeter) || maxElectricMeter < 9999 || maxElectricMeter > 9999999) {
        throw new Error('Max electric meter must be between 9999 and 9999999');
      }
    }

    if (maxWaterMeter !== undefined) {
      if (!Number.isInteger(maxWaterMeter) || maxWaterMeter < 9999 || maxWaterMeter > 9999999) {
        throw new Error('Max water meter must be between 9999 and 9999999');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with PROPERTY_OWNER role and PropertyInfo
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'PROPERTY_OWNER',
        isActive: true,
        propertyInfo: {
          create: {
            name: propertyName,
            address: propertyAddress,
            phone: phone || '',
            ownerName: ownerName || '',
            email: email || null,
            logoUrl: logoUrl || null,
            maxElectricMeter: maxElectricMeter || 999999,
            maxWaterMeter: maxWaterMeter || 99999,
          }
        }
      },
      include: {
        propertyInfo: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * List all property owners with their property information
   * Requirements: 1.1, 1.3
   * 
   * @returns {Promise<Array>} List of property owners
   */
  static async listPropertyOwners() {
    const users = await prisma.user.findMany({
      where: {
        role: 'PROPERTY_OWNER'
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        propertyInfo: true,
        _count: {
          select: {
            rooms: true,
            feeTypes: true,
            utilityRates: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
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
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'SUPER_ADMIN') {
      throw new Error('Cannot deactivate Super Admin');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true,
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
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true,
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { propertyInfo: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'PROPERTY_OWNER') {
      throw new Error('User is not a Property Owner');
    }

    // Update or create PropertyInfo
    let propertyInfo;
    if (user.propertyInfo) {
      // Update existing PropertyInfo
      propertyInfo = await prisma.propertyInfo.update({
        where: { id: user.propertyInfo.id },
        data: {
          name: data.propertyName !== undefined ? data.propertyName : user.propertyInfo.name,
          address: data.propertyAddress !== undefined ? data.propertyAddress : user.propertyInfo.address,
          phone: data.phone !== undefined ? data.phone : user.propertyInfo.phone,
          ownerName: data.ownerName !== undefined ? data.ownerName : user.propertyInfo.ownerName,
          email: data.email !== undefined ? data.email : user.propertyInfo.email,
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : user.propertyInfo.logoUrl,
          maxElectricMeter: data.maxElectricMeter !== undefined ? data.maxElectricMeter : user.propertyInfo.maxElectricMeter,
          maxWaterMeter: data.maxWaterMeter !== undefined ? data.maxWaterMeter : user.propertyInfo.maxWaterMeter,
        }
      });
    } else {
      // Create new PropertyInfo if doesn't exist
      if (!data.propertyName || !data.propertyAddress) {
        throw new Error('Property name and address are required');
      }
      propertyInfo = await prisma.propertyInfo.create({
        data: {
          userId,
          name: data.propertyName,
          address: data.propertyAddress,
          phone: data.phone || '',
          ownerName: data.ownerName || '',
          email: data.email || null,
          logoUrl: data.logoUrl || null,
          maxElectricMeter: data.maxElectricMeter || 999999,
          maxWaterMeter: data.maxWaterMeter || 99999,
        }
      });
    }

    return {
      userId,
      username: user.username,
      role: user.role,
      propertyInfo,
      updatedAt: propertyInfo.updatedAt,
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
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      include: { propertyInfo: true }
    });

    if (!fromUser || fromUser.role !== 'PROPERTY_OWNER') {
      throw new Error('Source user is not a Property Owner');
    }

    if (!fromUser.propertyInfo) {
      throw new Error('Source user does not have property information');
    }

    // Get target user
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
      include: { propertyInfo: true }
    });

    if (!toUser || toUser.role !== 'PROPERTY_OWNER') {
      throw new Error('Target user is not a Property Owner');
    }

    // Check if target user already has property
    if (toUser.propertyInfo) {
      throw new Error('Target user already has a property assigned');
    }

    // Transfer property info and all related data
    return await prisma.$transaction(async (tx) => {
      // 1. Update PropertyInfo to point to target user
      await tx.propertyInfo.update({
        where: { id: fromUser.propertyInfo.id },
        data: {
          userId: toUserId,
          name: fromUser.propertyInfo.name,
          address: fromUser.propertyInfo.address,
          phone: fromUser.propertyInfo.phone,
          ownerName: fromUser.propertyInfo.ownerName,
          email: fromUser.propertyInfo.email,
          logoUrl: fromUser.propertyInfo.logoUrl,
          maxElectricMeter: fromUser.propertyInfo.maxElectricMeter,
          maxWaterMeter: fromUser.propertyInfo.maxWaterMeter,
        }
      });

      // 2. Transfer all rooms
      await tx.room.updateMany({
        where: { userId: fromUserId },
        data: { userId: toUserId }
      });

      // 3. Transfer all fee types
      await tx.feeType.updateMany({
        where: { userId: fromUserId },
        data: { userId: toUserId }
      });

      // 4. Transfer all utility rates
      await tx.utilityRate.updateMany({
        where: { userId: fromUserId },
        data: { userId: toUserId }
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
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PROPERTY_OWNER' } }),
      prisma.user.count({ where: { role: 'PROPERTY_OWNER', isActive: true } }),
      prisma.propertyInfo.count(),
      prisma.room.count(),
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.bill.count(),
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
    const properties = await prisma.propertyInfo.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                rooms: true,
                feeTypes: true,
                utilityRates: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return properties;
  }
}
