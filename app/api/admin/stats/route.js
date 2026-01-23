import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * GET /api/admin/stats
 * Get system statistics
 * Requirements: 1.3
 */
async function getHandler() {
  try {
    const stats = await SuperAdminService.getSystemStats();

    return NextResponse.json(
      { data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting system stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get system stats' },
      { status: 500 }
    );
  }
}

export const GET = requireSuperAdmin(getHandler);
