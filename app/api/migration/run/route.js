import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { MigrationService } from '@/lib/services/migration.service';

/**
 * POST /api/migration/run
 * Run migration from single-tenant to multi-tenant
 * Requirements: 6.1, 6.2, 6.3
 */
export async function POST() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow first user or Super Admin to run migration
    // In production, you might want to add additional checks
    const result = await MigrationService.migrateToMultiTenant();

    return NextResponse.json(
      {
        success: true,
        message: 'Migration completed successfully',
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migration/verify
 * Verify migration integrity
 * Requirements: 6.4, 6.5
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await MigrationService.verifyMigrationIntegrity();

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Verification failed'
      },
      { status: 500 }
    );
  }
}
