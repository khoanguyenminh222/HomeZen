import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { getTemplateManagerService } from '@/lib/services/template-manager.service';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const templateManager = getTemplateManagerService();

// POST /api/templates/[id]/copy - Copy template
async function copyTemplateHandler(request, { params }) {
    try {
        const session = await auth();
        const { id } = await params;

        const copy = await templateManager.copyTemplate(id, session?.user?.id);

        return NextResponse.json({ success: true, data: copy }, { status: 201 });
    } catch (error) {
        return handleErrorResponse(error, 'Error copying template');
    }
}

export const POST = requireSuperAdmin(copyTemplateHandler);
