import { NextResponse } from 'next/server';
import { requireSuperAdmin, requireAuth } from '@/lib/middleware/authorization';
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

        // Check permissions
        const session = await auth();
        const userRole = session?.user?.vai_tro;
        const userId = session?.user?.id;

        const result = await templateManager.listTemplates({ page, limit, search, userRole, userId });
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
        const noi_dung = formData.get('html');
        const ten = formData.get('name');
        const mo_ta = formData.get('description');
        const thu_tuc_id = formData.get('procedureId');
        const danh_muc = formData.get('category');
        const css = formData.get('css');
        const js = formData.get('js');
        const huong_giay = formData.get('orientation');
        const anh_xa_tham_so_raw = formData.get('parameterMapping');
        let anh_xa_tham_so = [];
        try {
            if (anh_xa_tham_so_raw) anh_xa_tham_so = JSON.parse(anh_xa_tham_so_raw);
        } catch (e) {
            console.error('Error parsing parameterMapping', e);
        }

        if (!noi_dung || !ten || !thu_tuc_id) {
            return NextResponse.json({ success: false, message: 'Missing required fields (html, name, procedureId)' }, { status: 400 });
        }

        const template = await templateManager.createTemplate(
            { ten, mo_ta, thu_tuc_id, danh_muc, css, js, huong_giay, noi_dung, anh_xa_tham_so },
            session?.user?.id
        );

        return NextResponse.json({ success: true, data: template }, { status: 201 });
    } catch (error) {
        return handleErrorResponse(error, 'Error creating template');
    }
}

export const GET = requireAuth(listTemplatesHandler);
export const POST = requireSuperAdmin(createTemplateHandler);
