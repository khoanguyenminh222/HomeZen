import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * POST /api/admin/properties/[id]/assign
 * Assign property to property owner
 * Requirements: 2.1, 2.2, 2.5
 */
export async function POST(request, { params }) {
  return requireSuperAdmin(async () => {
    try {
      const { id: propertyId } = params;
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }

      const ownership = await SuperAdminService.assignPropertyToOwner(userId, propertyId);

      return NextResponse.json(
        {
          message: 'Property assigned successfully',
          data: ownership
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error assigning property:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to assign property' },
        { status: 500 }
      );
    }
  })();
}

/**
 * DELETE /api/admin/properties/[id]/assign
 * Remove property assignment from property owner
 * Requirements: 2.5
 */
export async function DELETE(request, { params }) {
  return requireSuperAdmin(async () => {
    try {
      const { id: propertyId } = params;
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required' },
          { status: 400 }
        );
      }

      await SuperAdminService.removePropertyFromOwner(userId, propertyId);

      return NextResponse.json(
        {
          message: 'Property assignment removed successfully'
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error removing property assignment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to remove property assignment' },
        { status: 500 }
      );
    }
  })();
}
