import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import prisma from '@/lib/prisma';

async function getPermissionsHandler(request, { params }) {
    try {
        const { id } = await params;

        const template = await prisma.rPT_MAU_BAO_CAO.findUnique({
            where: { id },
            select: {
                id: true,
                ten: true,
                phan_quyen: true
            }
        });

        if (!template) {
            return NextResponse.json(
                { success: false, message: 'Template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('Error getting permissions:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to get permissions' },
            { status: 500 }
        );
    }
}

async function updatePermissionsHandler(request, { params }) {
    try {
        const { id } = await params;
        const { userIds } = await request.json();

        if (!Array.isArray(userIds)) {
            return NextResponse.json(
                { success: false, message: 'userIds must be an array' },
                { status: 400 }
            );
        }

        const template = await prisma.rPT_MAU_BAO_CAO.update({
            where: { id },
            data: {
                phan_quyen: {
                    users: userIds,
                    roles: ['SIEU_QUAN_TRI'] // Always include admin
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Permissions updated successfully',
            data: template
        });
    } catch (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update permissions' },
            { status: 500 }
        );
    }
}

export const GET = requireSuperAdmin(getPermissionsHandler);
export const PATCH = requireSuperAdmin(updatePermissionsHandler);
