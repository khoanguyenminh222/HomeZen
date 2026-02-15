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

    const tenant = await prisma.tNT_NGUOI_THUE_CHINH.findUnique({
      where: { id },
      include: {
        phong: {
          select: {
            id: true,
            ma_phong: true,
            ten_phong: true,
            gia_phong: true,
            trang_thai: true
          }
        },
        nguoi_o: {
          orderBy: {
            ngay_tao: 'asc'
          }
        },
        hoan_tra_coc: {
          orderBy: {
            ngay_hoan_tra: 'desc'
          }
        }
      }
    });

    if (!tenant || tenant.ngay_xoa) {
      return NextResponse.json(
        { error: 'Không tìm thấy người thuê hoặc đã bị xóa' },
        { status: 404 }
      );
    }

    // Transform deposit to number for frontend compatibility if needed
    const tenantWithDeposit = {
      ...tenant,
      tien_coc: tenant.tien_coc ? parseFloat(tenant.tien_coc) : null,
      hoan_tra_coc: tenant.hoan_tra_coc.map(dr => ({
        ...dr,
        so_tien: parseFloat(dr.so_tien)
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
    const existingTenant = await prisma.tNT_NGUOI_THUE_CHINH.findUnique({
      where: { id }
    });

    if (!existingTenant || existingTenant.ngay_xoa) {
      return NextResponse.json(
        { error: 'Không tìm thấy người thuê hoặc đã bị xóa' },
        { status: 404 }
      );
    }

    // Kiểm tra số điện thoại trùng (nếu có thay đổi) - chỉ trong cùng property owner
    if (validatedData.dien_thoai && validatedData.dien_thoai !== existingTenant.dien_thoai) {
      // Xác định userId của tenant hiện tại
      let tenantUserId = existingTenant.nguoi_dung_id;

      // Nếu tenant có phòng, lấy userId từ phòng (để đảm bảo chính xác)
      if (existingTenant.phong_id && !tenantUserId) {
        const room = await prisma.pRP_PHONG.findUnique({
          where: { id: existingTenant.phong_id },
          select: { nguoi_dung_id: true }
        });
        tenantUserId = room?.nguoi_dung_id || null;
      }

      // Chỉ kiểm tra trùng phone trong cùng property owner
      if (tenantUserId) {
        const phoneExists = await prisma.tNT_NGUOI_THUE_CHINH.findFirst({
          where: {
            dien_thoai: validatedData.dien_thoai,
            nguoi_dung_id: tenantUserId,
            id: { not: id },
            ngay_xoa: null // Only check among active tenants
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
      let newUserId = existingTenant.nguoi_dung_id; // Giữ nguyên userId mặc định

      if (validatedData.phong_id && !existingTenant.phong_id) {
        // Kiểm tra phòng có tồn tại và trống không
        const room = await tx.pRP_PHONG.findUnique({
          where: { id: validatedData.phong_id },
          include: { nguoi_thue: true }
        });

        if (!room) {
          throw new Error('ROOM_NOT_FOUND');
        }

        if (room.nguoi_thue) {
          throw new Error('ROOM_OCCUPIED');
        }

        // Cập nhật userId từ room.userId
        newUserId = room.nguoi_dung_id;

        // Kiểm tra phòng có hóa đơn chưa thanh toán (nợ) không
        const allBills = await tx.bIL_HOA_DON.findMany({
          where: {
            phong_id: validatedData.phong_id
          },
          select: {
            id: true,
            thang: true,
            nam: true,
            tong_tien: true,
            so_tien_da_tra: true,
            da_thanh_toan: true
          }
        });

        // Lọc các hóa đơn chưa thanh toán đầy đủ
        const unpaidBills = allBills.filter(bill => {
          const totalCost = Number(bill.tong_tien || 0);
          const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
          return !bill.da_thanh_toan || (bill.da_thanh_toan && paidAmount < totalCost);
        });

        if (unpaidBills.length > 0) {
          const totalDebt = unpaidBills.reduce((sum, bill) => {
            const totalCost = Number(bill.tong_tien || 0);
            const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
            const debt = bill.da_thanh_toan ? Math.max(0, totalCost - paidAmount) : totalCost;
            return sum + debt;
          }, 0);

          throw new Error(`ROOM_HAS_DEBT:${unpaidBills.length}:${totalDebt}`);
        }

        // Cập nhật trạng thái phòng thành DA_THUE
        await tx.pRP_PHONG.update({
          where: { id: validatedData.phong_id },
          data: { trang_thai: 'DA_THUE' }
        });
      }

      // 2. Cập nhật thông tin người thuê
      return await tx.tNT_NGUOI_THUE_CHINH.update({
        where: { id },
        data: {
          ...(validatedData.ho_ten && { ho_ten: validatedData.ho_ten }),
          ...(validatedData.dien_thoai && { dien_thoai: validatedData.dien_thoai }),
          ...(validatedData.can_cuoc !== undefined && { can_cuoc: validatedData.can_cuoc || null }),
          ...(validatedData.ngay_sinh !== undefined && { ngay_sinh: validatedData.ngay_sinh }),
          ...(validatedData.que_quan !== undefined && { que_quan: validatedData.que_quan || null }),
          ...(validatedData.ngay_vao_o !== undefined && { ngay_vao_o: validatedData.ngay_vao_o }),
          ...(validatedData.tien_coc !== undefined && { tien_coc: validatedData.tien_coc }),
          ...(validatedData.url_hop_dong !== undefined && { url_hop_dong: validatedData.url_hop_dong || null }),
          ...(validatedData.phong_id && !existingTenant.phong_id && {
            phong_id: validatedData.phong_id,
            nguoi_dung_id: newUserId // Cập nhật userId từ room
          }),
          // Thông tin bổ sung
          ...(validatedData.gioi_tinh !== undefined && { gioi_tinh: validatedData.gioi_tinh || null }),
          ...(validatedData.nghe_nghiep !== undefined && { nghe_nghiep: validatedData.nghe_nghiep || null }),
          ...(validatedData.dan_toc !== undefined && { dan_toc: validatedData.dan_toc || null }),
          ...(validatedData.quoc_tich !== undefined && { quoc_tich: validatedData.quoc_tich || null }),
          ...(validatedData.dia_chi_thuong_tru !== undefined && { dia_chi_thuong_tru: validatedData.dia_chi_thuong_tru || null }),
          ...(validatedData.dia_chi_tam_tru !== undefined && { dia_chi_tam_tru: validatedData.dia_chi_tam_tru || null }),
          ...(validatedData.so_the_bao_hiem !== undefined && { so_the_bao_hiem: validatedData.so_the_bao_hiem || null }),
          ...(validatedData.ngay_cap !== undefined && { ngay_cap: validatedData.ngay_cap }),
          ...(validatedData.noi_cap !== undefined && { noi_cap: validatedData.noi_cap || null }),
        },
        include: {
          phong: {
            select: {
              id: true,
              ma_phong: true,
              ten_phong: true,
              gia_phong: true
            }
          },
          nguoi_o: true
        }
      });
    });

    return NextResponse.json({
      ...updatedTenant,
      tien_coc: updatedTenant.tien_coc ? parseFloat(updatedTenant.tien_coc) : null
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
