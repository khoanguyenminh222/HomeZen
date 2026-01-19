import prisma from '@/lib/prisma';

/**
 * Service for managing Tenant data with Soft Delete support
 */
export class TenantService {
    /**
     * Soft deletes a tenant, unlinking them from their room
     * @param {string} tenantId 
     * @param {string} userId 
     * @param {string} reason 
     */
    static async softDelete(tenantId, userId, reason) {
        return await prisma.$transaction(async (tx) => {
            // 1. Find tenant and their room
            const tenant = await tx.tenant.findUnique({
                where: { id: tenantId },
                include: { room: true }
            });

            if (!tenant) throw new Error('TENANT_NOT_FOUND');
            if (tenant.deletedAt) throw new Error('TENANT_ALREADY_DELETED');

            // 2. Unlink room and set room to EMPTY
            if (tenant.roomId) {
                await tx.room.update({
                    where: { id: tenant.roomId },
                    data: { status: 'EMPTY' }
                });
            }

            // 3. Mark tenant as deleted
            const updatedTenant = await tx.tenant.update({
                where: { id: tenantId },
                data: {
                    deletedAt: new Date(),
                    deletedBy: userId,
                    deleteReason: reason,
                    roomId: null // Soft delete unlinks the room as per requirement 3.3
                }
            });

            return updatedTenant;
        });
    }

    /**
     * Restores a soft-deleted tenant
     * @param {string} tenantId 
     * @param {string} userId 
     */
    static async restore(tenantId, userId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) throw new Error('TENANT_NOT_FOUND');
        if (!tenant.deletedAt) throw new Error('TENANT_NOT_DELETED');

        return await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                deletedAt: null,
                deletedBy: null,
                deleteReason: null
                // Note: Room is NOT automatically re-assigned as it might be occupied now
            }
        });
    }

    /**
     * Permanently deletes a tenant and all related data
     * @param {string} tenantId 
     * @param {string} userId 
     */
    static async permanentDelete(tenantId, userId) {
        return await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.findUnique({
                where: { id: tenantId }
            });

            if (!tenant) throw new Error('TENANT_NOT_FOUND');

            // 1. Manual cleanup of related records (since Cascade was removed)
            await tx.occupant.deleteMany({ where: { tenantId } });
            await tx.depositReturn.deleteMany({ where: { tenantId } });

            // 2. If somehow they still have a room, set it to EMPTY
            if (tenant.roomId) {
                await tx.room.update({
                    where: { id: tenant.roomId },
                    data: { status: 'EMPTY' }
                });
            }

            // 3. Hard delete
            return await tx.tenant.delete({
                where: { id: tenantId }
            });
        });
    }
}
