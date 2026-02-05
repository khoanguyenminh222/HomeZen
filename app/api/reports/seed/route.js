import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { seedInitialReports } from '@/lib/utils/report-seeder';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

// POST /api/reports/seed - Seed sample data
async function seedReportsHandler() {
    try {
        const session = await auth();
        await seedInitialReports(session?.user?.id);
        return NextResponse.json({ success: true, message: 'Sample reports seeded successfully' });
    } catch (error) {
        return handleErrorResponse(error, 'Error seeding sample reports');
    }
}

export const POST = requireSuperAdmin(seedReportsHandler);
