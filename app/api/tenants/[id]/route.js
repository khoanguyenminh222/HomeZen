import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateTenantSchema } from '@/lib/validations/tenant';
import { TenantService } from '@/lib/services/tenant.service';

// GET /api/tenants/[id] - Chi tiết người thuê
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
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
          orderBy: {
            createdAt: 'asc'
          }
        },
        depositReturns: {
          orderBy: {
            returnDate: 'desc'
          }
        }
      }
    });

    if (!tenant || tenant.deletedAt) {
      return NextResponse.json(
        { error: 'Không tìm thấy người thuê hoặc đã bị xóa' },
        { status: 404 }
      );
    }

    // Transform deposit to number
    const tenantWithDeposit = {
      ...tenant,
      deposit: tenant.deposit ? parseFloat(tenant.deposit) : null,
      depositReturns: tenant.depositReturns.map(dr => ({
        ...dr,
        amount: parseFloat(dr.amount)
      }))
    };

    return NextResponse.json(tenantWithDeposit);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy thông tin người thuê' },
      { status: 500 }
    );
  }
}

// PUT /api/tenants/[id] - Cập nhật người thuê
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateTenantSchema.parse(body);

    // Kiểm tra người thuê có tồn tại không
    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant || existingTenant.deletedAt) {
      return NextResponse.json(
        { error: 'Không tìm thấy người thuê hoặc đã bị xóa' },
        { status: 404 }
      );
    }

    // Kiểm tra số điện thoại trùng (nếu có thay đổi) - chỉ trong cùng property owner
    if (validatedData.phone && validatedData.phone !== existingTenant.phone) {
      // Xác định userId của tenant hiện tại
      let tenantUserId = existingTenant.userId;
      
      // Nếu tenant có phòng, lấy userId từ phòng (để đảm bảo chính xác)
      if (existingTenant.roomId && !tenantUserId) {
        const room = await prisma.room.findUnique({
          where: { id: existingTenant.roomId },
          select: { userId: true }
        });
        tenantUserId = room?.userId || null;
      }

      // Chỉ kiểm tra trùng phone trong cùng property owner
      if (tenantUserId) {
        const phoneExists = await prisma.tenant.findFirst({
          where: {
            phone: validatedData.phone,
            userId: tenantUserId,
            id: { not: id },
            deletedAt: null // Only check among active tenants
          }
        });

        if (phoneExists) {
          return NextResponse.json(
            { error: 'Số điện thoại đã được sử dụng bởi người thuê khác trong cùng dãy trọ' },
            { status: 400 }
          );
        }
      }
    }

    // Cập nhật người thuê trong transaction (để xử lý roomId)
    const updatedTenant = await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra và cập nhật roomId nếu có
      let newUserId = existingTenant.userId; // Giữ nguyên userId mặc định
      
      if (validatedData.roomId && !existingTenant.roomId) {
        // Kiểm tra phòng có tồn tại và trống không
        const room = await tx.room.findUnique({
          where: { id: validatedData.roomId },
          include: { tenant: true }
        });

        if (!room) {
          throw new Error('ROOM_NOT_FOUND');
        }

        if (room.tenant) {
          throw new Error('ROOM_OCCUPIED');
        }

        // Cập nhật userId từ room.userId
        newUserId = room.userId;

        // Kiểm tra phòng có hóa đơn chưa thanh toán (nợ) không
        const allBills = await tx.bill.findMany({
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

          throw new Error(`ROOM_HAS_DEBT:${unpaidBills.length}:${totalDebt}`);
        }

        // Cập nhật trạng thái phòng thành OCCUPIED
        await tx.room.update({
          where: { id: validatedData.roomId },
          data: { status: 'OCCUPIED' }
        });
      }

      // 2. Cập nhật thông tin người thuê
      return await tx.tenant.update({
        where: { id },
        data: {
          ...(validatedData.fullName && { fullName: validatedData.fullName }),
          ...(validatedData.phone && { phone: validatedData.phone }),
          ...(validatedData.idCard !== undefined && { idCard: validatedData.idCard || null }),
          ...(validatedData.dateOfBirth !== undefined && { dateOfBirth: validatedData.dateOfBirth }),
          ...(validatedData.hometown !== undefined && { hometown: validatedData.hometown || null }),
          ...(validatedData.moveInDate !== undefined && { moveInDate: validatedData.moveInDate }),
          ...(validatedData.deposit !== undefined && { deposit: validatedData.deposit }),
          ...(validatedData.contractFileUrl !== undefined && { contractFileUrl: validatedData.contractFileUrl || null }),
          ...(validatedData.roomId && !existingTenant.roomId && { 
            roomId: validatedData.roomId,
            userId: newUserId // Cập nhật userId từ room
          })
        },
        include: {
          room: {
            select: {
              id: true,
              code: true,
              name: true,
              price: true
            }
          },
          occupants: true
        }
      });
    });

    return NextResponse.json({
      ...updatedTenant,
      deposit: updatedTenant.deposit ? parseFloat(updatedTenant.deposit) : null
    });
  } catch (error) {
    console.error('Error updating tenant:', error);

    if (error.message === 'ROOM_NOT_FOUND') {
      return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
    }
    if (error.message === 'ROOM_OCCUPIED') {
      return NextResponse.json({ error: 'Phòng đã có người thuê' }, { status: 400 });
    }
    if (error.message?.startsWith('ROOM_HAS_DEBT')) {
      const [, unpaidBillsCount, totalDebt] = error.message.split(':');
      return NextResponse.json(
        { 
          error: `Phòng này còn ${unpaidBillsCount} hóa đơn chưa thanh toán đầy đủ. Tổng nợ: ${Number(totalDebt).toLocaleString('vi-VN')} VNĐ. Vui lòng thanh toán hết nợ trước khi gán người thuê mới.`,
          unpaidBillsCount: parseInt(unpaidBillsCount),
          totalDebt: Number(totalDebt)
        },
        { status: 400 }
      );
    }

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
      { error: 'Lỗi khi cập nhật người thuê' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id] - Xóa tạm thời người thuê (Soft Delete)
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get reason from body
    let reason = 'Không có lý do';
    try {
      const body = await request.json();
      reason = body.reason || reason;
    } catch (e) {
      // Body might be empty
    }

    const userId = session.user.id || session.user.email || 'Admin';

    await TenantService.softDelete(id, userId, reason);

    return NextResponse.json({ success: true, message: 'Đã xóa tạm thời người thuê' });
  } catch (error) {
    console.error('Error soft deleting tenant:', error);

    if (error.message === 'TENANT_NOT_FOUND') {
      return NextResponse.json({ error: 'Không tìm thấy người thuê' }, { status: 404 });
    }
    if (error.message === 'TENANT_ALREADY_DELETED') {
      return NextResponse.json({ error: 'Người thuê đã bị xóa trước đó' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Lỗi khi xóa người thuê' },
      { status: 500 }
    );
  }
}
