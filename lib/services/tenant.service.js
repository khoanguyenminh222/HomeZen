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
            const tenant = await tx.tNT_NGUOI_THUE_CHINH.findUnique({
                where: { id: tenantId },
                include: { phong: true }
            });

            if (!tenant) throw new Error('TENANT_NOT_FOUND');
            if (tenant.ngay_xoa) throw new Error('TENANT_ALREADY_DELETED');

            // 2. Unlink room and set room to EMPTY
            if (tenant.phong_id) {
                await tx.pRP_PHONG.update({
                    where: { id: tenant.phong_id },
                    data: { trang_thai: 'TRONG' }
                });
            }

            // 3. Mark tenant as deleted
            const updatedTenant = await tx.tNT_NGUOI_THUE_CHINH.update({
                where: { id: tenantId },
                data: {
                    ngay_xoa: new Date(),
                    nguoi_xoa: userId,
                    ly_do_xoa: reason,
                    phong_id: null // Soft delete unlinks the room as per requirement 3.3
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
        const tenant = await prisma.tNT_NGUOI_THUE_CHINH.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) throw new Error('TENANT_NOT_FOUND');
        if (!tenant.ngay_xoa) throw new Error('TENANT_NOT_DELETED');

        return await prisma.tNT_NGUOI_THUE_CHINH.update({
            where: { id: tenantId },
            data: {
                ngay_xoa: null,
                nguoi_xoa: null,
                ly_do_xoa: null
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
            const tenant = await tx.tNT_NGUOI_THUE_CHINH.findUnique({
                where: { id: tenantId }
            });

            if (!tenant) throw new Error('TENANT_NOT_FOUND');

            // 1. Manual cleanup of related records (since Cascade was removed)
            await tx.tNT_NGUOI_O.deleteMany({ where: { nguoi_thue_id: tenantId } });
            await tx.tNT_LICH_SU_HOAN_TRA_COC.deleteMany({ where: { nguoi_thue_id: tenantId } });

            // 2. If somehow they still have a room, set it to EMPTY
            if (tenant.phong_id) {
                await tx.pRP_PHONG.update({
                    where: { id: tenant.phong_id },
                    data: { trang_thai: 'TRONG' }
                });
            }

            // 3. Hard delete
            return await tx.tNT_NGUOI_THUE_CHINH.delete({
                where: { id: tenantId }
            });
        });
    }
}
