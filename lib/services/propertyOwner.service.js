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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        propertyInfo: true,
        _count: {
          select: {
            rooms: true,
            feeTypes: true,
            utilityRates: true,
          }
        }
      }
    });

    if (!user || !user.propertyInfo) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      propertyInfo: user.propertyInfo,
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
      userId,
      ...filters
    };

    const rooms = await prisma.room.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            propertyInfo: {
              select: {
                name: true,
              }
            },
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
   * Get tenants for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of tenants
   */
  static async getMyTenants(userId, filters = {}) {
    const where = {
      room: {
        userId
      },
      deletedAt: null,
      ...filters
    };

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        room: {
          include: {
            user: {
              select: {
                id: true,
                propertyInfo: {
                  select: {
                    name: true,
                  }
                },
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
   * Get fee types for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of fee types
   */
  static async getMyFeeTypes(userId, filters = {}) {
    const where = {
      userId,
      ...filters
    };

    const feeTypes = await prisma.feeType.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            propertyInfo: {
              select: {
                name: true,
              }
            },
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
   * Get utility rates for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of utility rates
   */
  static async getMyUtilityRates(userId, filters = {}) {
    const where = {
      userId,
      ...filters
    };

    const utilityRates = await prisma.utilityRate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            propertyInfo: {
              select: {
                name: true,
              }
            },
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
   * Get bills for user's property
   * Requirements: 2.2, 5.2
   * 
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of bills
   */
  static async getMyBills(userId, filters = {}) {
    const where = {
      room: {
        userId
      },
      ...filters
    };

    const bills = await prisma.bill.findMany({
      where,
      include: {
        room: {
          include: {
            user: {
              select: {
                id: true,
                propertyInfo: {
                  select: {
                    name: true,
                  }
                },
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
      prisma.room.count({
        where: { userId }
      }),
      prisma.room.count({
        where: { userId, status: 'EMPTY' }
      }),
      prisma.room.count({
        where: { userId, status: 'OCCUPIED' }
      }),
      prisma.tenant.count({
        where: {
          room: {
            userId
          },
          deletedAt: null
        }
      }),
      prisma.bill.findMany({
        where: {
          room: {
            userId
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
      currentMonthRevenue,
      unpaidBillsCount,
      totalUnpaidAmount,
    };
  }
}
