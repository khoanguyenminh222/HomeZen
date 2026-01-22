import prisma from '@/lib/prisma';

/**
 * Migration Service for migrating from single-tenant to multi-tenant
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export class MigrationService {
  /**
   * Migrate existing data from single-tenant to multi-tenant
   * Creates default Property from PropertyInfo and links all existing data
   * 
   * @returns {Promise<Object>} Migration result with statistics
   */
  static async migrateToMultiTenant() {
    return await prisma.$transaction(async (tx) => {
      const result = {
        property: null,
        roomsMigrated: 0,
        feeTypesMigrated: 0,
        utilityRatesMigrated: 0,
        usersUpdated: 0,
        errors: []
      };

      try {
        // 1. Get existing PropertyInfo (should be only one)
        const propertyInfo = await tx.propertyInfo.findFirst();
        
        if (!propertyInfo) {
          throw new Error('Không tìm thấy thông tin nhà trọ. Vui lòng tạo thông tin nhà trọ trước.');
        }

        // 2. Check if migration already done
        const existingProperty = await tx.property.findFirst({
          where: {
            name: propertyInfo.name,
            address: propertyInfo.address
          }
        });

        if (existingProperty) {
          // Migration already done, return existing property
          result.property = existingProperty;
          result.roomsMigrated = await tx.room.count({ where: { propertyId: existingProperty.id } });
          result.feeTypesMigrated = await tx.feeType.count({ where: { propertyId: existingProperty.id } });
          result.utilityRatesMigrated = await tx.utilityRate.count({ where: { propertyId: existingProperty.id } });
          return result;
        }

        // 3. Create default Property from PropertyInfo
        const property = await tx.property.create({
          data: {
            name: propertyInfo.name,
            address: propertyInfo.address,
            phone: propertyInfo.phone,
            ownerName: propertyInfo.ownerName,
            email: propertyInfo.email,
            logoUrl: propertyInfo.logoUrl,
            maxElectricMeter: propertyInfo.maxElectricMeter,
            maxWaterMeter: propertyInfo.maxWaterMeter,
          }
        });

        result.property = property;

        // 4. Get first user (assume it's the property owner)
        const firstUser = await tx.user.findFirst({
          orderBy: { createdAt: 'asc' }
        });

        if (firstUser) {
          // 5. Create PropertyOwnership for first user
          await tx.propertyOwnership.create({
            data: {
              userId: firstUser.id,
              propertyId: property.id
            }
          });

          // 6. Update first user to PROPERTY_OWNER role if not already set
          if (firstUser.role !== 'PROPERTY_OWNER') {
            await tx.user.update({
              where: { id: firstUser.id },
              data: { role: 'PROPERTY_OWNER' }
            });
            result.usersUpdated = 1;
          }
        }

        // 7. Migrate all Rooms to the new Property
        const rooms = await tx.room.findMany({
          where: { propertyId: null }
        });

        for (const room of rooms) {
          try {
            await tx.room.update({
              where: { id: room.id },
              data: { propertyId: property.id }
            });
            result.roomsMigrated++;
          } catch (error) {
            result.errors.push(`Error migrating room ${room.code}: ${error.message}`);
          }
        }

        // 8. Migrate all FeeTypes to the new Property
        const feeTypes = await tx.feeType.findMany({
          where: { propertyId: null }
        });

        for (const feeType of feeTypes) {
          try {
            await tx.feeType.update({
              where: { id: feeType.id },
              data: { propertyId: property.id }
            });
            result.feeTypesMigrated++;
          } catch (error) {
            result.errors.push(`Error migrating feeType ${feeType.name}: ${error.message}`);
          }
        }

        // 9. Migrate all UtilityRates to the new Property
        const utilityRates = await tx.utilityRate.findMany({
          where: { propertyId: null }
        });

        for (const utilityRate of utilityRates) {
          try {
            await tx.utilityRate.update({
              where: { id: utilityRate.id },
              data: { propertyId: property.id }
            });
            result.utilityRatesMigrated++;
          } catch (error) {
            result.errors.push(`Error migrating utilityRate ${utilityRate.id}: ${error.message}`);
          }
        }

        return result;
      } catch (error) {
        result.errors.push(`Migration failed: ${error.message}`);
        throw error;
      }
    });
  }

  /**
   * Verify data integrity after migration
   * 
   * @returns {Promise<Object>} Verification result
   */
  static async verifyMigrationIntegrity() {
    const result = {
      isValid: true,
      issues: []
    };

    try {
      // Check if all rooms have propertyId
      const roomsWithoutProperty = await prisma.room.count({
        where: { propertyId: null }
      });

      if (roomsWithoutProperty > 0) {
        result.isValid = false;
        result.issues.push(`${roomsWithoutProperty} phòng chưa được gán property`);
      }

      // Check if all feeTypes have propertyId
      const feeTypesWithoutProperty = await prisma.feeType.count({
        where: { propertyId: null }
      });

      if (feeTypesWithoutProperty > 0) {
        result.isValid = false;
        result.issues.push(`${feeTypesWithoutProperty} loại phí chưa được gán property`);
      }

      // Check if all utilityRates have propertyId
      const utilityRatesWithoutProperty = await prisma.utilityRate.count({
        where: { propertyId: null }
      });

      if (utilityRatesWithoutProperty > 0) {
        result.isValid = false;
        result.issues.push(`${utilityRatesWithoutProperty} đơn giá điện nước chưa được gán property`);
      }

      // Check if at least one property exists
      const propertyCount = await prisma.property.count();
      if (propertyCount === 0) {
        result.isValid = false;
        result.issues.push('Không có property nào trong hệ thống');
      }

      return result;
    } catch (error) {
      result.isValid = false;
      result.issues.push(`Verification error: ${error.message}`);
      return result;
    }
  }

  /**
   * Rollback migration (for testing purposes)
   * WARNING: This will remove propertyId from all records
   * 
   * @param {string} propertyId - Property ID to rollback
   * @returns {Promise<Object>} Rollback result
   */
  static async rollbackMigration(propertyId) {
    return await prisma.$transaction(async (tx) => {
      const result = {
        roomsRolledBack: 0,
        feeTypesRolledBack: 0,
        utilityRatesRolledBack: 0,
        propertyDeleted: false,
        errors: []
      };

      try {
        // 1. Remove propertyId from all rooms
        const rooms = await tx.room.findMany({
          where: { propertyId }
        });

        for (const room of rooms) {
          try {
            await tx.room.update({
              where: { id: room.id },
              data: { propertyId: null }
            });
            result.roomsRolledBack++;
          } catch (error) {
            result.errors.push(`Error rolling back room ${room.code}: ${error.message}`);
          }
        }

        // 2. Remove propertyId from all feeTypes
        const feeTypes = await tx.feeType.findMany({
          where: { propertyId }
        });

        for (const feeType of feeTypes) {
          try {
            await tx.feeType.update({
              where: { id: feeType.id },
              data: { propertyId: null }
            });
            result.feeTypesRolledBack++;
          } catch (error) {
            result.errors.push(`Error rolling back feeType ${feeType.name}: ${error.message}`);
          }
        }

        // 3. Remove propertyId from all utilityRates
        const utilityRates = await tx.utilityRate.findMany({
          where: { propertyId }
        });

        for (const utilityRate of utilityRates) {
          try {
            await tx.utilityRate.update({
              where: { id: utilityRate.id },
              data: { propertyId: null }
            });
            result.utilityRatesRolledBack++;
          } catch (error) {
            result.errors.push(`Error rolling back utilityRate ${utilityRate.id}: ${error.message}`);
          }
        }

        // 4. Delete PropertyOwnerships
        await tx.propertyOwnership.deleteMany({
          where: { propertyId }
        });

        // 5. Delete Property
        await tx.property.delete({
          where: { id: propertyId }
        });

        result.propertyDeleted = true;

        return result;
      } catch (error) {
        result.errors.push(`Rollback failed: ${error.message}`);
        throw error;
      }
    });
  }
}
