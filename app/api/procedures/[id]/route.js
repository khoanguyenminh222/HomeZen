import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getProcedureManagerService } from '@/lib/services/procedure-manager.service';
import { requireSuperAdmin } from '@/lib/middleware/authorization';

const procedureManager = getProcedureManagerService();

// GET /api/procedures/[id]
async function getProcedureHandler(_request, { params }) {
  try {
    const { id } = await params;
    const procedure = await procedureManager.getProcedure(id);
    return NextResponse.json({ success: true, data: procedure });
  } catch (error) {
    console.error('Error getting procedure', error);
    const status = error.message === 'Procedure not found' ? 404 : 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status }
    );
  }
}

// PUT /api/procedures/[id]
async function updateProcedureHandler(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    const body = await request.json();
    const { sql, metadata } = body;

    const updated = await procedureManager.updateProcedure(
      id,
      sql,
      metadata,
      session?.user?.id || null
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating procedure', error);
    const status =
      error.name === 'SQLValidationError'
        ? 400
        : error.message === 'Procedure not found'
          ? 404
          : 500;
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
        details: error.details || null
      },
      { status }
    );
  }
}

// DELETE /api/procedures/[id]
async function deleteProcedureHandler(_request, { params }) {
  try {
    const { id } = await params;
    await procedureManager.deleteProcedure(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting procedure', error);
    const status = error.message === 'Procedure not found' ? 404 : 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status }
    );
  }
}

export const GET = requireSuperAdmin(getProcedureHandler);
export const PUT = requireSuperAdmin(updateProcedureHandler);
export const DELETE = requireSuperAdmin(deleteProcedureHandler);

