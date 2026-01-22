import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * PATCH /api/admin/property-owners/[id]/activate
 * Activate a property owner account
 * Requirements: 1.4
 */
export async function PATCH(request, { params }) {
  return requireSuperAdmin(async () => {
    try {
      const { id } = params;
      const body = await request.json();
      const { action } = body;

      if (action === 'activate') {
        const user = await SuperAdminService.activatePropertyOwner(id);
        return NextResponse.json(
          {
            message: 'Property owner activated successfully',
            data: user
          },
          { status: 200 }
        );
      } else if (action === 'deactivate') {
        const user = await SuperAdminService.deactivatePropertyOwner(id);
        return NextResponse.json(
          {
            message: 'Property owner deactivated successfully',
            data: user
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { error: 'Invalid action. Use "activate" or "deactivate"' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error updating property owner:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update property owner' },
        { status: 500 }
      );
    }
  })();
}
