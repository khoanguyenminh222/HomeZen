import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { SuperAdminService } from '@/lib/services/superAdmin.service';

/**
 * GET /api/admin/properties
 * List all properties
 * Requirements: 1.3, 2.1
 */
export async function GET() {
  return requireSuperAdmin(async () => {
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
  })();
}

/**
 * POST /api/admin/properties
 * Create a new property
 * Requirements: 2.1, 2.2
 */
export async function POST(request) {
  return requireSuperAdmin(async () => {
    try {
      const body = await request.json();
      const { name, address, phone, ownerName, email, logoUrl, maxElectricMeter, maxWaterMeter } = body;

      if (!name || !address || !phone || !ownerName) {
        return NextResponse.json(
          { error: 'Name, address, phone, and ownerName are required' },
          { status: 400 }
        );
      }

      const property = await SuperAdminService.createProperty({
        name,
        address,
        phone,
        ownerName,
        email,
        logoUrl,
        maxElectricMeter,
        maxWaterMeter,
      });

      return NextResponse.json(
        {
          message: 'Property created successfully',
          data: property
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create property' },
        { status: 500 }
      );
    }
  })();
}
