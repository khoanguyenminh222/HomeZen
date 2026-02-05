import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/authorization';
import { getProcedureManagerService } from '@/lib/services/procedure-manager.service';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { handleErrorResponse } from '@/lib/utils/report-errors';

const procedureManager = getProcedureManagerService();

// GET /api/procedures - List procedures
async function listProceduresHandler() {
  try {
    const procedures = await procedureManager.listProcedures();
    return NextResponse.json({ success: true, data: procedures });
  } catch (error) {
    return handleErrorResponse(error, 'Error listing procedures');
  }
}

// POST /api/procedures - Create procedure
async function createProcedureHandler(request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { sql, metadata } = body;

    const procedure = await procedureManager.createProcedure(sql, metadata, session?.user?.id);
    return NextResponse.json({ success: true, data: procedure }, { status: 201 });
  } catch (error) {
    return handleErrorResponse(error, 'Error creating procedure');
  }
}

export const GET = requireSuperAdmin(listProceduresHandler);
export const POST = requireSuperAdmin(createProcedureHandler);
