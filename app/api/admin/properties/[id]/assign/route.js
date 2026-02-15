import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * POST /api/admin/properties/[id]/assign
 * Transfer property ownership from one owner to another
 * Requirements: 2.6
 */
async function postHandler(request, props) {
  try {
    const params = await props.params;
    const { id: fromUserId } = params;
    const body = await request.json();
    const { toUserId } = body;

    if (!toUserId) {
      return NextResponse.json(
        { error: 'toUserId is required' },
        { status: 400 }
      );
    }

    const result = await SuperAdminService.transferPropertyOwnership(fromUserId, toUserId);

    return NextResponse.json(
      {
        message: 'Property ownership transferred successfully',
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error transferring property ownership:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transfer property ownership' },
      { status: 500 }
    );
  }
}

export const POST = requireSuperAdmin(postHandler);
