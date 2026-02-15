import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/authorization';
import { getReportGeneratorService } from '@/lib/services/report-generator.service.js';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const reportGenerator = getReportGeneratorService();

// POST /api/reports/generate - Generate a new report (PDF)
async function generateReportHandler(request) {
    try {
        const session = await auth();
        const body = await request.json();
        const { templateId, parameters } = body;

        if (!templateId) {
            return NextResponse.json(
                { success: false, error: { message: 'Missing templateId', code: 'GEN_MISSING_ID' } },
                { status: 400 }
            );
        }

        const report = await reportGenerator.generateReport({
            templateId,
            parameters: parameters || {},
            userId: session?.user?.id
        });

        return NextResponse.json({ success: true, data: report });
    } catch (error) {
        return handleErrorResponse(error, 'Error generating report');
    }
}

export const POST = requireAuth(generateReportHandler);
