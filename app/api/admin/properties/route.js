import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * GET /api/admin/properties
 * List all properties
 * Requirements: 1.3, 2.1
 */
async function getHandler() {
  try {
    const properties = await SuperAdminService.listProperties();

    return NextResponse.json(
      { data: properties },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing properties:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list properties' },
      { status: 500 }
    );
  }
}

export const GET = requireSuperAdmin(getHandler);

/**
 * POST /api/admin/properties
 * Create a new property owner with property information
 * Requirements: 2.1, 2.2
 */
async function postHandler(request) {
  try {
    const body = await request.json();
    const { username, password, propertyName, propertyAddress, phone, ownerName, email, logoUrl, maxElectricMeter, maxWaterMeter } = body;

    if (!username || !password || !propertyName || !propertyAddress) {
      return NextResponse.json(
        { error: 'Username, password, propertyName, and propertyAddress are required' },
        { status: 400 }
      );
    }

    const propertyOwner = await SuperAdminService.createPropertyOwner({
      username,
      password,
      propertyName,
      propertyAddress,
      phone,
      ownerName,
      email,
      logoUrl,
      maxElectricMeter,
      maxWaterMeter,
    });

    return NextResponse.json(
      {
        message: 'Property owner created successfully',
        data: propertyOwner
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
