import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getDebtWarnings } from '@/lib/debt/getDebtWarnings';

/**
 * GET /api/debt/warnings
 * Lấy danh sách cảnh báo nợ (phòng nợ 2+ tháng liên tiếp)
 * Requirements: 18.5, 18.6
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const warnings = await getDebtWarnings();

    return NextResponse.json(warnings);
  } catch (error) {
    console.error('Error fetching debt warnings:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách cảnh báo nợ' },
      { status: 500 }
    );
  }
}
