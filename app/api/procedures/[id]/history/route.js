import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { getProcedureManagerService } from '@/lib/services/procedure-manager.service';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const procedureManager = getProcedureManagerService();

// GET /api/procedures/[id]/history - Get change history
async function getHistoryHandler(request, context) {
    try {
        const { id } = await context.params;
        const history = await procedureManager.getProcedureHistory(id);
        return NextResponse.json({ success: true, data: history });
    } catch (error) {
        return handleErrorResponse(error, 'Error fetching procedure history');
    }
}

export const GET = requireSuperAdmin(getHistoryHandler);
