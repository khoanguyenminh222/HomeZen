import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/**
 * GET /api/rooms/[id]/meter-history - Lấy lịch sử chỉ số điện nước
 * Requirements: 17.1-17.3
 * Query params: startMonth, endMonth, startYear, endYear
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate id
    if (!id) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: id },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');
    const startYear = searchParams.get('startYear');
    const endYear = searchParams.get('endYear');

    // Build where clause
    const where = {
      phong_id: id,
    };

    // Filter by date range if provided
    if (startYear && startMonth) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { nam: { gt: parseInt(startYear) } },
          {
            nam: parseInt(startYear),
            thang: { gte: parseInt(startMonth) },
          },
        ],
      });
    }

    if (endYear && endMonth) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { nam: { lt: parseInt(endYear) } },
          {
            nam: parseInt(endYear),
            thang: { lte: parseInt(endMonth) },
          },
        ],
      });
    }

    // Fetch bills with meter readings
    const bills = await prisma.bIL_HOA_DON.findMany({
      where,
      select: {
        id: true,
        thang: true,
        nam: true,
        chi_so_dien_cu: true,
        chi_so_dien_moi: true,
        tieu_thu_dien: true,
        dien_vuot_nguong: true,
        chi_so_nuoc_cu: true,
        chi_so_nuoc_moi: true,
        tieu_thu_nuoc: true,
        nuoc_vuot_nguong: true,
        ngay_tao: true,
      },
      orderBy: [
        { nam: 'asc' },
        { thang: 'asc' },
      ],
    });

    // Format data for response
    const history = bills.map(bill => ({
      id: bill.id,
      month: bill.thang,
      year: bill.nam,
      date: `${bill.thang}/${bill.nam}`,
      electric: {
        old: bill.chi_so_dien_cu,
        new: bill.chi_so_dien_moi,
        usage: bill.tieu_thu_dien,
        rollover: bill.dien_vuot_nguong,
      },
      water: {
        old: bill.chi_so_nuoc_cu,
        new: bill.chi_so_nuoc_moi,
        usage: bill.tieu_thu_nuoc,
        rollover: bill.nuoc_vuot_nguong,
      },
      createdAt: bill.ngay_tao,
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        ma_phong: room.ma_phong,
        ten_phong: room.ten_phong,
      },
      history,
    });
  } catch (error) {
    console.error('Error fetching meter history:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy lịch sử chỉ số' },
      { status: 500 }
    );
  }
}
