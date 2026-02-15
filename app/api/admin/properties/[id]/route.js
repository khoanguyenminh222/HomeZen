import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * PATCH /api/admin/properties/[id]
 * Update property information for a property owner
 * Requirements: 2.2, 2.6
 */
async function patchHandler(request, props) {
  try {
    const params = await props.params;
    const { id: userId } = params;
    const body = await request.json();

    // Mapping body fields directly to service, using schema exact names
    const updateData = {
      ten: body.ten,
      dia_chi: body.dia_chi,
      dien_thoai: body.dien_thoai,
      ten_chu_nha: body.ten_chu_nha,
      email: body.email,
      logo_url: body.logo_url,
      max_dong_ho_dien: body.max_dong_ho_dien,
      max_dong_ho_nuoc: body.max_dong_ho_nuoc
    };

    const updatedUser = await SuperAdminService.updatePropertyInfo(userId, updateData);

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
