import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createTenantSchema } from '@/lib/validations/tenant';
import { isSuperAdmin, validateResourceOwnership } from '@/lib/middleware/authorization';
import { logUnauthorizedAccess, logAuthorizationViolation } from '@/lib/middleware/security-logging';

// GET /api/tenants - Danh sách người thuê
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roomId = searchParams.get('roomId');

    // Xây dựng where clause
    const where = {
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { room: { code: { contains: search, mode: 'insensitive' } } },
        { room: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (roomId) {
      where.roomId = roomId;
    }

    // Add user filter for Property Owners (filter by rooms they own)
    if (!isSuperAdmin(session)) {
      where.room = {
        ...where.room,
        userId: session.user.id
      };
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
            status: true
          }
        },
        occupants: {
          select: {
            id: true,
            fullName: true,
            residenceType: true
          }
        },
        _count: {
          select: {
            occupants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data để tính tổng số người ở
    const tenantsWithCounts = tenants.map(tenant => ({
      ...tenant,
      totalOccupants: tenant._count.occupants,
      deposit: tenant.deposit ? parseFloat(tenant.deposit) : null
    }));

    return NextResponse.json(tenantsWithCounts);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách người thuê' },
      { status: 500 }
    );
  }
}

// POST /api/tenants - Tạo người thuê mới
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createTenantSchema.parse(body);

    // 1. Kiểm tra phòng nếu có chọn phòng
    if (validatedData.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: validatedData.roomId },
        include: { tenant: true }
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Phòng không tồn tại' },
          { status: 404 }
        );
      }

      // Validate room ownership
      if (!isSuperAdmin(session)) {
        const hasAccess = await validateResourceOwnership(session.user.id, room.id, 'room');
        if (!hasAccess) {
          logAuthorizationViolation(request, session, `No access to room ${room.id}`, room.id, 'room');
          return NextResponse.json(
            { error: 'Forbidden: No access to this room' },
            { status: 403 }
          );
        }
      }

      if (room.tenant) {
        return NextResponse.json(
          { error: 'Phòng đã có người thuê' },
          { status: 400 }
        );
      }

      // Kiểm tra phòng có hóa đơn chưa thanh toán (nợ) không
      const allBills = await prisma.bill.findMany({
        where: {
          roomId: validatedData.roomId
        },
        select: {
          id: true,
          month: true,
          year: true,
          totalCost: true,
          paidAmount: true,
          isPaid: true
        }
      });

      // Lọc các hóa đơn chưa thanh toán đầy đủ
      const unpaidBills = allBills.filter(bill => {
        const totalCost = Number(bill.totalCost || 0);
        const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
        return !bill.isPaid || (bill.isPaid && paidAmount < totalCost);
      });

      if (unpaidBills.length > 0) {
        const totalDebt = unpaidBills.reduce((sum, bill) => {
          const totalCost = Number(bill.totalCost || 0);
          const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
          const debt = bill.isPaid ? Math.max(0, totalCost - paidAmount) : totalCost;
          return sum + debt;
        }, 0);

        return NextResponse.json(
          { 
            error: `Phòng này còn ${unpaidBills.length} hóa đơn chưa thanh toán đầy đủ. Tổng nợ: ${totalDebt.toLocaleString('vi-VN')} VNĐ. Vui lòng thanh toán hết nợ trước khi gán người thuê mới.`,
            unpaidBillsCount: unpaidBills.length,
            totalDebt: totalDebt
          },
          { status: 400 }
        );
      }
    }

    // 2. Kiểm tra số điện thoại đã tồn tại chưa
    const existingTenant = await prisma.tenant.findFirst({
      where: { phone: validatedData.phone }
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Số điện thoại đã được sử dụng bởi người thuê khác' },
        { status: 400 }
      );
    }

    // 3. Tạo người thuê mới (có hoặc không có phòng)
    const result = await prisma.$transaction(async (tx) => {
      // Tạo người thuê
      const tenant = await tx.tenant.create({
        data: {
          fullName: validatedData.fullName,
          phone: validatedData.phone,
          idCard: validatedData.idCard || null,
          dateOfBirth: validatedData.dateOfBirth || null,
          hometown: validatedData.hometown || null,
          moveInDate: validatedData.moveInDate || null,
          deposit: validatedData.deposit || null,
          contractFileUrl: validatedData.contractFileUrl || null,
          roomId: validatedData.roomId || null
        },
        include: {
          room: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true
            }
          }
        }
      });

      // Cập nhật trạng thái phòng thành OCCUPIED nếu có phòng
      if (validatedData.roomId) {
        await tx.room.update({
          where: { id: validatedData.roomId },
          data: { status: 'OCCUPIED' }
        });
      }

      return tenant;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi tạo người thuê' },
      { status: 500 }
    );
  }
}