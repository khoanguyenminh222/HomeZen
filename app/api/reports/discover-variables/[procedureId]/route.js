import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import prisma from '@/lib/prisma';
import { getDataConnectorService } from '@/lib/services/data-connector.service';
import { getVariableManagerService } from '@/lib/services/variable-manager.service';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const dataConnector = getDataConnectorService();
const variableManager = getVariableManagerService();

// GET /api/reports/discover-variables/[procedureId]
async function discoverVariablesHandler(request, { params }) {
    try {
        const { procedureId } = await params;

        if (!procedureId) {
            return NextResponse.json({ success: false, error: 'Missing procedureId' }, { status: 400 });
        }

        // 1. Lấy định nghĩa procedure
        const procedure = await prisma.reportProcedure.findUnique({
            where: { id: procedureId }
        });

        if (!procedure) {
            return NextResponse.json({ success: false, error: 'Procedure not found' }, { status: 404 });
        }

        // 2. Lấy dữ liệu mẫu (1 dòng)
        const sampleRow = await dataConnector.getSampleData(procedure.name, procedure.parameters || []);

        if (!sampleRow) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No data returned from procedure to discover variables.'
            });
        }

        // 3. Nhận diện biến từ dữ liệu mẫu
        const variables = await variableManager.discoverVariablesFromData(sampleRow);

        return NextResponse.json({
            success: true,
            data: variables,
            sample: sampleRow // Trả về cả dòng mẫu để người dùng tham khảo
        });
    } catch (error) {
        return handleErrorResponse(error, 'Error discovering variables');
    }
}

export const GET = requireSuperAdmin(discoverVariablesHandler);
