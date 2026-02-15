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

        const noi_dung = formData.get('html');
        const ten = formData.get('name');
        const mo_ta = formData.get('description');
        const thu_tuc_id = formData.get('procedureId');
        const danh_muc = formData.get('category');
        const css = formData.get('css');
        const js = formData.get('js');
        const huong_giay = formData.get('orientation');
        const anh_xa_tham_so_raw = formData.get('parameterMapping');
        let anh_xa_tham_so = undefined;
        try {
            if (anh_xa_tham_so_raw) anh_xa_tham_so = JSON.parse(anh_xa_tham_so_raw);
        } catch (e) {
            console.error('Error parsing parameterMapping', e);
        }


        const template = await templateManager.updateTemplate(id, {
            ten,
            mo_ta,
            thu_tuc_id,
            danh_muc,
            css,
            js,
            huong_giay,
            noi_dung,
            anh_xa_tham_so
        });

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        return handleErrorResponse(error, 'Error updating template');
    }
}

export const GET = requireSuperAdmin(getTemplateHandler);
export const PATCH = requireSuperAdmin(updateTemplateHandler);
export const DELETE = requireSuperAdmin(deleteTemplateHandler);
