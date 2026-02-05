import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { getTemplateManagerService } from '@/lib/services/template-manager.service';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const templateManager = getTemplateManagerService();

// GET /api/templates - List templates
async function listTemplatesHandler(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';

        const result = await templateManager.listTemplates({ page, limit, search });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return handleErrorResponse(error, 'Error listing templates');
    }
}

// POST /api/templates - Upload/Create template
async function createTemplateHandler(request) {
    try {
        const session = await auth();
        const formData = await request.formData();
        const html = formData.get('html');
        const name = formData.get('name');
        const description = formData.get('description');
        const procedureId = formData.get('procedureId');
        const category = formData.get('category');
        const css = formData.get('css');
        const js = formData.get('js');
        const orientation = formData.get('orientation');
        const designerStateRaw = formData.get('designerState');

        if (!html || !name || !procedureId) {
            return NextResponse.json({ success: false, message: 'Missing required fields (html, name, procedureId)' }, { status: 400 });
        }

        let designerState = null;
        if (designerStateRaw) {
            try {
                designerState = typeof designerStateRaw === 'string' ? JSON.parse(designerStateRaw) : designerStateRaw;
            } catch (e) {
                console.error('Error parsing designerState:', e);
            }
        }

        const template = await templateManager.createTemplate(
            { name, description, procedureId, category, designerState, css, js, orientation, html },
            session?.user?.id
        );

        return NextResponse.json({ success: true, data: template }, { status: 201 });
    } catch (error) {
        return handleErrorResponse(error, 'Error creating template');
    }
}

export const GET = requireSuperAdmin(listTemplatesHandler);
export const POST = requireSuperAdmin(createTemplateHandler);
