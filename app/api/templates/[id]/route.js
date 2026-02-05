import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { getTemplateManagerService } from '@/lib/services/template-manager.service';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const templateManager = getTemplateManagerService();

// GET /api/templates/[id] - Get template details
async function getTemplateHandler(_request, { params }) {
    try {
        const { id } = await params;
        const template = await templateManager.getTemplate(id);
        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        return handleErrorResponse(error, 'Error getting template');
    }
}

// DELETE /api/templates/[id] - Delete template
async function deleteTemplateHandler(_request, { params }) {
    try {
        const { id } = await params;
        await templateManager.deleteTemplate(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleErrorResponse(error, 'Error deleting template');
    }
}

// PATCH /api/templates/[id] - Update template
async function updateTemplateHandler(request, { params }) {
    try {
        const { id } = await params;
        const formData = await request.formData();

        const html = formData.get('html');
        const name = formData.get('name');
        const description = formData.get('description');
        const procedureId = formData.get('procedureId');
        const category = formData.get('category');
        const designerStateRaw = formData.get('designerState');
        const css = formData.get('css');
        const js = formData.get('js');
        const orientation = formData.get('orientation');

        let designerState = undefined;
        if (designerStateRaw) {
            try {
                designerState = typeof designerStateRaw === 'string' ? JSON.parse(designerStateRaw) : designerStateRaw;
            } catch (e) {
                console.error('Error parsing designerState:', e);
            }
        }

        const template = await templateManager.updateTemplate(id, {
            name,
            description,
            procedureId,
            category,
            designerState,
            css,
            js,
            orientation,
            html
        });

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        return handleErrorResponse(error, 'Error updating template');
    }
}

export const GET = requireSuperAdmin(getTemplateHandler);
export const PATCH = requireSuperAdmin(updateTemplateHandler);
export const DELETE = requireSuperAdmin(deleteTemplateHandler);
