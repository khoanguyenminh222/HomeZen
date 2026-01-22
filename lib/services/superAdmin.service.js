import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

/**
 * Super Admin Service
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2
 */
export class SuperAdminService {
  /**
   * Create a new property owner account
   * Requirements: 1.1, 1.2
   * 
   * @param {Object} data - Property owner data
   * @param {string} data.username - Username (must be unique)
   * @param {string} data.password - Plain text password
   * @returns {Promise<Object>} Created user
   */
  static async createPropertyOwner({ username, password }) {
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with PROPERTY_OWNER role
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'PROPERTY_OWNER',
        isActive: true,
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * List all property owners
   * Requirements: 1.1
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
        propertyOwnerships: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              }
            }
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
   * Create a new property
   * Requirements: 2.1, 2.2
   * 
   * @param {Object} data - Property data
   * @param {string} data.name - Property name
   * @param {string} data.address - Property address
   * @param {string} data.phone - Property phone
   * @param {string} data.ownerName - Owner name
   * @param {string} data.email - Owner email (optional)
   * @param {string} data.logoUrl - Logo URL (optional)
   * @param {number} data.maxElectricMeter - Max electric meter value
   * @param {number} data.maxWaterMeter - Max water meter value
   * @returns {Promise<Object>} Created property
   */
  static async createProperty(data) {
    const property = await prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        ownerName: data.ownerName,
        email: data.email || null,
        logoUrl: data.logoUrl || null,
        maxElectricMeter: data.maxElectricMeter || 999999,
        maxWaterMeter: data.maxWaterMeter || 99999,
      }
    });

    return property;
  }

  /**
   * Assign property to property owner
   * Requirements: 2.1, 2.2, 2.5
   * 
   * @param {string} userId - User ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Created PropertyOwnership
   */
  static async assignPropertyToOwner(userId, propertyId) {
    // Verify user is PROPERTY_OWNER
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'PROPERTY_OWNER') {
      throw new Error('User is not a Property Owner');
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Check if ownership already exists
    const existingOwnership = await prisma.propertyOwnership.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (existingOwnership) {
      throw new Error('Property already assigned to this owner');
    }

    // Create PropertyOwnership
    const ownership = await prisma.propertyOwnership.create({
      data: {
        userId,
        propertyId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        }
      }
    });

    return ownership;
  }

  /**
   * Remove property assignment from property owner
   * Requirements: 2.5
   * 
   * @param {string} userId - User ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Deleted PropertyOwnership
   */
  static async removePropertyFromOwner(userId, propertyId) {
    const ownership = await prisma.propertyOwnership.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (!ownership) {
      throw new Error('Property ownership not found');
    }

    await prisma.propertyOwnership.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    return { success: true };
  }

  /**
   * Transfer property between owners
   * Requirements: 2.5
   * 
   * @param {string} fromUserId - Current owner user ID
   * @param {string} toUserId - New owner user ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Transfer result
   */
  static async transferProperty(fromUserId, toUserId, propertyId) {
    // Remove from old owner
    await this.removePropertyFromOwner(fromUserId, propertyId);

    // Assign to new owner
    await this.assignPropertyToOwner(toUserId, propertyId);

    return { success: true };
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
      prisma.property.count(),
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
   * List all properties
   * Requirements: 1.3, 2.1
   * 
   * @returns {Promise<Array>} List of properties
   */
  static async listProperties() {
    const properties = await prisma.property.findMany({
      include: {
        propertyOwnerships: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                isActive: true,
              }
            }
          }
        },
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

    return properties;
  }
}
