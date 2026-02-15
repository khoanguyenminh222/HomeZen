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
      ngay_xoa: null
    };

    if (roomId) {
      where.phong_id = roomId;
    }

    // Add user filter for Property Owners (filter by rooms they own or tenants without room)
    if (!isSuperAdmin(session)) {
      const ownershipFilter = {
        OR: [
          { phong: { nguoi_dung_id: session.user.id } },
          { nguoi_dung_id: session.user.id }
        ]
      };

      if (search) {
        // Kết hợp ownership filter và search filter
        where.AND = [
          ownershipFilter,
          {
            OR: [
              { ho_ten: { contains: search, mode: 'insensitive' } },
              { dien_thoai: { contains: search } },
              { phong: { ma_phong: { contains: search, mode: 'insensitive' } } },
              { phong: { ten_phong: { contains: search, mode: 'insensitive' } } }
            ]
          }
        ];
      } else {
        // Chỉ có ownership filter
        where.OR = ownershipFilter.OR;
      }
    } else if (search) {
      // Super admin với search
      where.OR = [
        { ho_ten: { contains: search, mode: 'insensitive' } },
        { dien_thoai: { contains: search } },
        { phong: { ma_phong: { contains: search, mode: 'insensitive' } } },
        { phong: { ten_phong: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const tenants = await prisma.tNT_NGUOI_THUE_CHINH.findMany({
      where,
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
          select: {
            id: true,
            ho_ten: true,
            loai_cu_tru: true
          }
        },
        _count: {
          select: {
            nguoi_o: true
          }
        }
      },
      orderBy: {
        ngay_tao: 'desc'
      }
    });

    // Transform data để tính tổng số người ở
    const tenantsWithCounts = tenants.map(tenant => ({
      ...tenant,
      totalOccupants: tenant._count.nguoi_o,
      deposit: tenant.tien_coc ? parseFloat(tenant.tien_coc) : null
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
    if (validatedData.phong_id) {
      const room = await prisma.pRP_PHONG.findUnique({
        where: { id: validatedData.phong_id },
        include: { nguoi_thue: true }
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

      if (room.nguoi_thue) {
        return NextResponse.json(
          { error: 'Phòng đã có người thuê' },
          { status: 400 }
        );
      }

      // Kiểm tra phòng có hóa đơn chưa thanh toán (nợ) không
      const allBills = await prisma.bIL_HOA_DON.findMany({
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

    // 2. Xác định userId cho tenant
    let tenantUserId = null;
    if (validatedData.phong_id) {
      // Nếu có phòng, lấy userId từ phòng
      const room = await prisma.pRP_PHONG.findUnique({
        where: { id: validatedData.phong_id },
        select: { nguoi_dung_id: true }
      });
      tenantUserId = room?.nguoi_dung_id || null;
    } else {
      // Nếu không có phòng, lấy userId từ session (property owner)
      if (!isSuperAdmin(session)) {
        tenantUserId = session.user.id;
      }
    }

    // 3. Kiểm tra số điện thoại đã tồn tại chưa (chỉ trong cùng property owner)
    if (tenantUserId) {
      const existingTenant = await prisma.tNT_NGUOI_THUE_CHINH.findFirst({
        where: {
          dien_thoai: validatedData.dien_thoai,
          nguoi_dung_id: tenantUserId,
          ngay_xoa: null // Chỉ kiểm tra tenant chưa bị xóa
        }
      });

      if (existingTenant) {
        return NextResponse.json(
          { error: 'Số điện thoại đã được sử dụng bởi người thuê khác trong cùng dãy trọ' },
          { status: 400 }
        );
      }
    }

    // 4. Tạo người thuê mới (có hoặc không có phòng)
    const result = await prisma.$transaction(async (tx) => {
      // Tạo người thuê
      const tenant = await tx.tNT_NGUOI_THUE_CHINH.create({
        data: {
          ho_ten: validatedData.ho_ten,
          dien_thoai: validatedData.dien_thoai,
          can_cuoc: validatedData.can_cuoc || null,
          ngay_sinh: validatedData.ngay_sinh || null,
          que_quan: validatedData.que_quan || null,
          ngay_vao_o: validatedData.ngay_vao_o || null,
          tien_coc: validatedData.tien_coc || null,
          url_hop_dong: validatedData.url_hop_dong || null,
          phong_id: validatedData.phong_id || null,
          nguoi_dung_id: tenantUserId,
          // Thông tin bổ sung
          gioi_tinh: validatedData.gioi_tinh || null,
          nghe_nghiep: validatedData.nghe_nghiep || null,
          dan_toc: validatedData.dan_toc || null,
          quoc_tich: validatedData.quoc_tich || null,
          dia_chi_thuong_tru: validatedData.dia_chi_thuong_tru || null,
          dia_chi_tam_tru: validatedData.dia_chi_tam_tru || null,
          so_the_bao_hiem: validatedData.so_the_bao_hiem || null,
          ngay_cap: validatedData.ngay_cap || null,
          noi_cap: validatedData.noi_cap || null,
        },
        include: {
          phong: {
            select: {
              id: true,
              ma_phong: true,
              ten_phong: true,
              gia_phong: true
            }
          }
        }
      });

      // Cập nhật trạng thái phòng thành DA_THUE nếu có phòng
      if (validatedData.phong_id) {
        await tx.pRP_PHONG.update({
          where: { id: validatedData.phong_id },
          data: { trang_thai: 'DA_THUE' }
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