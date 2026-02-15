import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * GET /api/admin/property-owners
 * List all property owners
 * Requirements: 1.1
 */
async function getHandler() {
  try {
    const propertyOwners = await SuperAdminService.listPropertyOwners();

    return NextResponse.json(
      { data: propertyOwners },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing property owners:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list property owners' },
      { status: 500 }
    );
  }
}

export const GET = requireSuperAdmin(getHandler);

/**
 * POST /api/admin/property-owners
 * Create a new property owner with property information
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */
async function postHandler(request) {
  try {
    const body = await request.json();
    const {
      tai_khoan,
      mat_khau,
      ten,
      dia_chi,
      dien_thoai,
      ten_chu_nha,
      email,
      logo_url,
      max_dong_ho_dien,
      max_dong_ho_nuoc
    } = body;

    if (!tai_khoan || !mat_khau) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (mat_khau.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!ten || !dia_chi) {
      return NextResponse.json(
        { error: 'Property name and address are required' },
        { status: 400 }
      );
    }

    const user = await SuperAdminService.createPropertyOwner({
      tai_khoan: tai_khoan,
      mat_khau,
      ten,
      dia_chi,
      dien_thoai,
      ten_chu_nha,
      email,
      logo_url,
      max_dong_ho_dien,
      max_dong_ho_nuoc,
    });

    return NextResponse.json(
      {
        message: 'Property owner created successfully',
        data: user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property owner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create property owner' },
      { status: 500 }
    );
  }
}

export const POST = requireSuperAdmin(postHandler);
