import prisma from '@/lib/prisma';
import { getUserPropertyIds } from '@/lib/middleware/authorization';

/**
 * Property Owner Service
 * Requirements: 2.1, 2.2, 5.1, 5.2, 5.4
 */
export class PropertyOwnerService {
  /**
   * Get all properties accessible by user
   * Requirements: 2.1
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of properties
   */
  static async getMyProperties(userId) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return [];
    }

    const properties = await prisma.property.findMany({
      where: {
        id: {
          in: propertyIds
        }
      },
      include: {
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

  /**
   * Get rooms for user's properties
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of rooms
   */
  static async getMyRooms(userId, filters = {}) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return [];
    }

    const where = {
      propertyId: {
        in: propertyIds
      },
      ...filters
    };

    const rooms = await prisma.room.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          }
        },
        tenant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          }
        },
        _count: {
          select: {
            bills: true,
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    return rooms;
  }

  /**
   * Get tenants for user's properties
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of tenants
   */
  static async getMyTenants(userId, filters = {}) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return [];
    }

    const where = {
      room: {
        propertyId: {
          in: propertyIds
        }
      },
      deletedAt: null,
      ...filters
    };

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        room: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        occupants: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return tenants;
  }

  /**
   * Get fee types for user's properties
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of fee types
   */
  static async getMyFeeTypes(userId, filters = {}) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return [];
    }

    const where = {
      propertyId: {
        in: propertyIds
      },
      ...filters
    };

    const feeTypes = await prisma.feeType.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            roomFees: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return feeTypes;
  }

  /**
   * Get utility rates for user's properties
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of utility rates
   */
  static async getMyUtilityRates(userId, filters = {}) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return [];
    }

    const where = {
      propertyId: {
        in: propertyIds
      },
      ...filters
    };

    const utilityRates = await prisma.utilityRate.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          }
        },
        room: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        tieredRates: {
          orderBy: {
            minUsage: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return utilityRates;
  }

  /**
   * Get bills for user's properties
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of bills
   */
  static async getMyBills(userId, filters = {}) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return [];
    }

    const where = {
      room: {
        propertyId: {
          in: propertyIds
        }
      },
      ...filters
    };

    const bills = await prisma.bill.findMany({
      where,
      include: {
        room: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        billFees: true,
      },
      orderBy: {
        year: 'desc',
        month: 'desc'
      }
    });

    return bills;
  }

  /**
   * Get dashboard stats for user's properties
   * Requirements: 5.4, 5.5
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboard statistics
   */
  static async getMyDashboardStats(userId) {
    const propertyIds = await getUserPropertyIds(userId);

    if (propertyIds.length === 0) {
      return {
        totalRooms: 0,
        emptyRooms: 0,
        occupiedRooms: 0,
        totalTenants: 0,
        totalProperties: 0,
        currentMonthRevenue: 0,
        unpaidBillsCount: 0,
        totalUnpaidAmount: 0,
      };
    }

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
      prisma.room.count({
        where: { propertyId: { in: propertyIds } }
      }),
      prisma.room.count({
        where: { propertyId: { in: propertyIds }, status: 'EMPTY' }
      }),
      prisma.room.count({
        where: { propertyId: { in: propertyIds }, status: 'OCCUPIED' }
      }),
      prisma.tenant.count({
        where: {
          room: {
            propertyId: { in: propertyIds }
          },
          deletedAt: null
        }
      }),
      prisma.bill.findMany({
        where: {
          room: {
            propertyId: { in: propertyIds }
          },
          month: currentMonth,
          year: currentYear,
        },
        select: {
          totalCost: true,
          isPaid: true,
          paidAmount: true,
        }
      })
    ]);

    const unpaidBills = currentMonthBills.filter(bill => !bill.isPaid);
    const unpaidBillsCount = unpaidBills.length;
    const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => {
      return sum + Number(bill.totalCost);
    }, 0);

    const paidBills = currentMonthBills.filter(bill => bill.isPaid);
    const currentMonthRevenue = paidBills.reduce((sum, bill) => {
      return sum + (Number(bill.paidAmount) || Number(bill.totalCost));
    }, 0);

    return {
      totalRooms,
      emptyRooms,
      occupiedRooms,
      totalTenants,
      totalProperties: propertyIds.length,
      currentMonthRevenue,
      unpaidBillsCount,
      totalUnpaidAmount,
    };
  }
}
