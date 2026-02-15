import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import prisma from '@/lib/prisma';
import { getDataConnectorService } from '@/lib/services/data-connector.service';
import { getVariableManagerService } from '@/lib/services/variable-manager.service';
import { getProcedureManagerService } from '@/lib/services/procedure-manager.service';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const dataConnector = getDataConnectorService();
const variableManager = getVariableManagerService();
const procedureManager = getProcedureManagerService();

// GET /api/reports/discover-variables/[procedureId]
async function discoverVariablesHandler(request, { params }) {
    try {
        const { procedureId } = await params;

        if (!procedureId) {
            return NextResponse.json({ success: false, error: 'Missing procedureId' }, { status: 400 });
        }

        // 1. Lấy định nghĩa procedure
        const procedure = await prisma.rPT_THU_TUC.findUnique({
            where: { id: procedureId }
        });

        if (!procedure) {
            return NextResponse.json({ success: false, error: 'Procedure not found' }, { status: 404 });
        }

        // 2. Khám phá biến tĩnh từ RETURNS TABLE trong SQL
        const staticVariables = procedureManager.detectReturnColumns(procedure.dinh_nghia_sql).map(col => ({
            name: col.name,
            type: col.type.toLowerCase().includes('text') || col.type.toLowerCase().includes('varchar') ? 'string' :
                col.type.toLowerCase().includes('int') || col.type.toLowerCase().includes('decimal') || col.type.toLowerCase().includes('numeric') ? 'number' :
                    col.type.toLowerCase().includes('timestamp') || col.type.toLowerCase().includes('date') ? 'date' : 'string',
            description: `Phân tích từ SQL (${col.name})`
        }));

        // 3. Lấy dữ liệu mẫu (Dynamic Discovery) if possible
        let dynamicVariables = [];
        let sampleRow = null;
        try {
            sampleRow = await dataConnector.getSampleData(procedure.ten, procedure.tham_so || []);
            if (sampleRow) {
                dynamicVariables = await variableManager.discoverVariablesFromData(sampleRow);
            }
        } catch (e) {
            console.warn('Dynamic discovery failed, falling back to static analysis', e);
        }

        // 4. Kết hợp kết quả (Ưu tiên các biến tìm thấy từ dữ liệu mẫu vì kiểu dữ liệu chính xác hơn)
        // Nhưng Static Variables đảm bảo chúng ta không bị "trắng" biến khi DB trống.
        const variablesMap = new Map();

        staticVariables.forEach(v => variablesMap.set(v.name, v));
        dynamicVariables.forEach(v => variablesMap.set(v.name, v));

        return NextResponse.json({
            success: true,
            data: Array.from(variablesMap.values()),
            sample: sampleRow
        });
    } catch (error) {
        return handleErrorResponse(error, 'Error discovering variables');
    }
}

export const GET = requireSuperAdmin(discoverVariablesHandler);
