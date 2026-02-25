import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/authorization';
import { getReportGeneratorService } from '@/lib/services/report-generator.service.js';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const reportGenerator = getReportGeneratorService();

// POST /api/reports/generate - Generate a new report (PDF)
async function generateReportHandler(request, context, session) {
    try {
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

        // Trả về binary response
        return new NextResponse(report.buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${report.fileName}"`,
                'Content-Length': report.buffer.length.toString(),
            },
        });
    } catch (error) {
        return handleErrorResponse(error, 'Error generating report');
    }
}

export const POST = requireAuth(generateReportHandler);
