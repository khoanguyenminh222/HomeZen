import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { getReportGeneratorService } from '@/lib/services/report-generator.service.js';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const reportGenerator = getReportGeneratorService();

// GET /api/reports/preview/[templateId] - Preview report as HTML
async function previewReportHandler(request, { params }) {
    try {
        const session = await auth();
        const { templateId } = await params;

        // Lấy parameters từ query string
        const { searchParams } = new URL(request.url);
        const parameters = Object.fromEntries(searchParams.entries());

        if (!templateId) {
            return new Response('Missing templateId', { status: 400 });
        }

        const html = await reportGenerator.generatePreview({
            templateId,
            parameters,
            userId: session?.user?.id
        });

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });
    } catch (error) {
        return handleErrorResponse(error, 'Error generating preview');
    }
}

export const GET = requireAuth(previewReportHandler);
