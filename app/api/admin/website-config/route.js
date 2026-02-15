// app/api/admin/website-config/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getWebsiteConfigurationService } from '@/lib/services/website-configuration.service';
import { requireSuperAdmin } from '@/lib/middleware/authorization';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/website-config
 * Get current website configuration
 * Requirements: 5.1
 */
export async function GET() {
  try {
    const service = getWebsiteConfigurationService();
    const config = await service.getCurrentConfiguration();

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching website configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/website-config
 * Update website configuration (Super Admin only)
 * Requirements: 5.2, 5.4
 */
export const PUT = requireSuperAdmin(async (request) => {
  try {
    const session = await auth();
    const data = await request.json();

    const service = getWebsiteConfigurationService();

    // Delete old images if URLs are being replaced
    const currentConfig = await service.getCurrentConfiguration();

    if (data.logo_url && currentConfig.logo_url &&
      data.logo_url !== currentConfig.logo_url &&
      currentConfig.logo_url.startsWith('http')) {
      await service.deleteOldImage(currentConfig.logo_url);
    }

    if (data.favicon_url && currentConfig.favicon_url &&
      data.favicon_url !== currentConfig.favicon_url &&
      currentConfig.favicon_url.startsWith('http')) {
      await service.deleteOldImage(currentConfig.favicon_url);
    }

    if (data.anh_hero_url && currentConfig.anh_hero_url &&
      data.anh_hero_url !== currentConfig.anh_hero_url &&
      currentConfig.anh_hero_url.startsWith('http')) {
      await service.deleteOldImage(currentConfig.anh_hero_url);
    }

    if (data.anh_loi_url && currentConfig.anh_loi_url &&
      data.anh_loi_url !== currentConfig.anh_loi_url &&
      currentConfig.anh_loi_url.startsWith('http')) {
      await service.deleteOldImage(currentConfig.anh_loi_url);
    }

    const config = await service.updateConfiguration(data, session.user.id);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating website configuration:', error);

    // Handle validation errors
    if (error.name === 'ValidationError' && error.details) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.details
        },
        { status: 400 }
      );
    }

    // Handle ZodError directly (fallback)
    if (error.name === 'ZodError' && error.errors && Array.isArray(error.errors)) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to update configuration'
      },
      { status: 500 }
    );
  }
});
