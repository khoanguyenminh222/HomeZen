import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * PATCH /api/admin/properties/[id]
 * Update property information for a property owner
 * Requirements: 2.2, 2.6
 */
async function patchHandler(request, { params }) {
  try {
    const { id: userId } = params;
    const body = await request.json();

    const updatedUser = await SuperAdminService.updatePropertyInfo(userId, body);

    return NextResponse.json(
      {
        message: 'Property information updated successfully',
        data: updatedUser
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating property info:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update property information' },
      { status: 500 }
    );
  }
}

export const PATCH = requireSuperAdmin(patchHandler);
