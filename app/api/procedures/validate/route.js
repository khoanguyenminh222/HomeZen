import { NextResponse } from 'next/server';
import { getProcedureManagerService } from '@/lib/services/procedure-manager.service';
import { requireSuperAdmin } from '@/lib/middleware/authorization';

const procedureManager = getProcedureManagerService();

// POST /api/procedures/validate
async function validateHandler(request) {
  try {
    const body = await request.json();
    const { sql } = body;

    const result = await procedureManager.validateSQL(sql);
    const status = result.isValid ? 200 : 400;

    return NextResponse.json({ success: result.isValid, data: result }, { status });
  } catch (error) {
    console.error('Error validating SQL', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireSuperAdmin(validateHandler);

