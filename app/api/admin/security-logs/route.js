import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/security-logs
 * Danh sách nhật ký bảo mật (Super Admin only)
 */
async function getHandler(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const page = parseInt(searchParams.get('page')) || 1;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.securityLog.findMany({
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: skip,
            }),
            prisma.securityLog.count(),
        ]);

        return NextResponse.json({
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching security logs:', error);
        return NextResponse.json(
            { error: 'Không thể tải nhật ký bảo mật' },
            { status: 500 }
        );
    }
}

export const GET = requireSuperAdmin(getHandler);
