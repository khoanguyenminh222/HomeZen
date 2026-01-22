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
    const room = await prisma.room.findUnique({
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
      roomId: id,
    };

    // Filter by date range if provided
    if (startYear && startMonth) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { year: { gt: parseInt(startYear) } },
          {
            year: parseInt(startYear),
            month: { gte: parseInt(startMonth) },
          },
        ],
      });
    }

    if (endYear && endMonth) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { year: { lt: parseInt(endYear) } },
          {
            year: parseInt(endYear),
            month: { lte: parseInt(endMonth) },
          },
        ],
      });
    }

    // Fetch bills with meter readings
    const bills = await prisma.bill.findMany({
      where,
      select: {
        id: true,
        month: true,
        year: true,
        oldElectricReading: true,
        newElectricReading: true,
        electricityUsage: true,
        electricityRollover: true,
        oldWaterReading: true,
        newWaterReading: true,
        waterUsage: true,
        waterRollover: true,
        createdAt: true,
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
      ],
    });

    // Format data for response
    const history = bills.map(bill => ({
      id: bill.id,
      month: bill.month,
      year: bill.year,
      date: `${bill.month}/${bill.year}`,
      electric: {
        old: bill.oldElectricReading,
        new: bill.newElectricReading,
        usage: bill.electricityUsage,
        rollover: bill.electricityRollover,
      },
      water: {
        old: bill.oldWaterReading,
        new: bill.newWaterReading,
        usage: bill.waterUsage,
        rollover: bill.waterRollover,
      },
      createdAt: bill.createdAt,
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
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
