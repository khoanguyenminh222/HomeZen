import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import {
  roomUtilityRateSchema,
  updateRoomUtilityRateSchema,
  validateTieredRates
} from '@/lib/validations/utilityRate';
import { validateResourceOwnership } from '@/lib/middleware/authorization';

// GET /api/rooms/[id]/utility-rates - Lấy đơn giá riêng của phòng
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Validate property access
    const hasAccess = await validateResourceOwnership(session.user.id, roomId, 'room');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this room' },
        { status: 403 }
      );
    }

    // Tìm đơn giá riêng của phòng
    const roomRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
      where: { phong_id: roomId },
      include: {
        bac_thang_gia: {
          orderBy: { muc_tieu_thu_min: 'asc' }
        }
      }
    });

    if (!roomRate) {
      // Trả về null nếu phòng chưa có đơn giá riêng (sẽ dùng đơn giá chung)
      return NextResponse.json(null);
    }

    return NextResponse.json(roomRate);
  } catch (error) {
    console.error('Error fetching room utility rates:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy đơn giá riêng của phòng' },
      { status: 500 }
    );
  }
}

// PUT /api/rooms/[id]/utility-rates - Cập nhật đơn giá riêng
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;
    const body = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Validate property access
    const hasAccess = await validateResourceOwnership(session.user.id, roomId, 'room');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this room' },
        { status: 403 }
      );
    }

    // Validate input
    const validatedData = updateRoomUtilityRateSchema.parse(body);

    // Validate tiered rates nếu có
    if (validatedData.su_dung_bac_thang && validatedData.bac_thang_gia) {
      const validation = validateTieredRates(validatedData.bac_thang_gia);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      validatedData.bac_thang_gia = validation.sortedRates;
    }

    // Tìm đơn giá riêng hiện tại
    let roomRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
      where: { phong_id: roomId }
    });

    if (!roomRate) {
      // Tạo mới nếu chưa có
      const createData = {
        phong_id: roomId,
        la_chung: false,
        gia_dien: validatedData.gia_dien || null,
        gia_nuoc: validatedData.gia_nuoc || null,
        phuong_thuc_tinh_nuoc: validatedData.phuong_thuc_tinh_nuoc || 'DONG_HO',
        gia_nuoc_theo_nguoi: validatedData.gia_nuoc_theo_nguoi || null,
        su_dung_bac_thang: validatedData.su_dung_bac_thang || false,
      };

      roomRate = await prisma.pRP_DON_GIA_DIEN_NUOC.create({
        data: createData
      });

      // Tạo các bậc thang nếu có
      if (validatedData.su_dung_bac_thang && validatedData.bac_thang_gia && validatedData.bac_thang_gia.length > 0) {
        await prisma.pRP_BAC_THANG_GIA_DIEN.createMany({
          data: validatedData.bac_thang_gia.map(rate => ({
            ...rate,
            don_gia_id: roomRate.id
          }))
        });
      }
    } else {
      // Cập nhật trong transaction để đảm bảo consistency
      await prisma.$transaction(async (tx) => {
        // Xóa các bậc thang cũ nếu có
        if (validatedData.bac_thang_gia !== undefined) {
          await tx.pRP_BAC_THANG_GIA_DIEN.deleteMany({
            where: { don_gia_id: roomRate.id }
          });
        }

        // Cập nhật đơn giá riêng
        roomRate = await tx.pRP_DON_GIA_DIEN_NUOC.update({
          where: { id: roomRate.id },
          data: {
            gia_dien: validatedData.gia_dien !== undefined ? validatedData.gia_dien : roomRate.gia_dien,
            gia_nuoc: validatedData.gia_nuoc !== undefined ? validatedData.gia_nuoc : roomRate.gia_nuoc,
            phuong_thuc_tinh_nuoc: validatedData.phuong_thuc_tinh_nuoc || roomRate.phuong_thuc_tinh_nuoc,
            gia_nuoc_theo_nguoi: validatedData.gia_nuoc_theo_nguoi !== undefined ? validatedData.gia_nuoc_theo_nguoi : roomRate.gia_nuoc_theo_nguoi,
            su_dung_bac_thang: validatedData.su_dung_bac_thang !== undefined ? validatedData.su_dung_bac_thang : roomRate.su_dung_bac_thang,
          }
        });

        // Tạo các bậc thang mới nếu có
        if (validatedData.su_dung_bac_thang && validatedData.bac_thang_gia && validatedData.bac_thang_gia.length > 0) {
          await tx.pRP_BAC_THANG_GIA_DIEN.createMany({
            data: validatedData.bac_thang_gia.map(rate => ({
              ...rate,
              don_gia_id: roomRate.id
            }))
          });
        }
      });
    }

    // Lấy dữ liệu đầy đủ để trả về
    const updatedRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
      where: { id: roomRate.id },
      include: {
        bac_thang_gia: {
          orderBy: { muc_tieu_thu_min: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedRate);
  } catch (error) {
    console.error('Error updating room utility rates:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật đơn giá riêng' },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[id]/utility-rates - Xóa đơn giá riêng (dùng chung)
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json(
        { error: 'ID phòng không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra phòng có tồn tại không
    const room = await prisma.pRP_PHONG.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Validate property access
    const hasAccess = await validateResourceOwnership(session.user.id, roomId, 'room');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this room' },
        { status: 403 }
      );
    }

    // Tìm và xóa đơn giá riêng
    const roomRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
      where: { phong_id: roomId }
    });

    if (!roomRate) {
      return NextResponse.json(
        { error: 'Phòng này chưa có đơn giá riêng' },
        { status: 404 }
      );
    }

    // Xóa trong transaction để đảm bảo consistency
    await prisma.$transaction(async (tx) => {
      // Xóa các bậc thang trước
      await tx.pRP_BAC_THANG_GIA_DIEN.deleteMany({
        where: { don_gia_id: roomRate.id }
      });

      // Xóa đơn giá riêng
      await tx.pRP_DON_GIA_DIEN_NUOC.delete({
        where: { id: roomRate.id }
      });
    });

    return NextResponse.json({
      message: 'Đã xóa đơn giá riêng. Phòng sẽ sử dụng đơn giá chung.'
    });
  } catch (error) {
    console.error('Error deleting room utility rates:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa đơn giá riêng' },
      { status: 500 }
    );
  }
}