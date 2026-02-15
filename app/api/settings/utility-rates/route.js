import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import {
  globalUtilityRateSchema,
  updateGlobalUtilityRateSchema,
  validateTieredRates
} from '@/lib/validations/utilityRate';
import { isSuperAdmin } from '@/lib/middleware/authorization';

// GET /api/settings/utility-rates - Lấy đơn giá chung (Super Admin) hoặc property utility rate (Property Owner)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super Admin: get global rate
    if (isSuperAdmin(session)) {
      // Tìm đơn giá chung (la_chung = true)
      const globalRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findFirst({
        where: { la_chung: true, nguoi_dung_id: null },
        include: {
          bac_thang_gia: {
            orderBy: { muc_tieu_thu_min: 'asc' }
          }
        }
      });

      if (!globalRate) {
        // Tạo đơn giá chung mặc định nếu chưa có
        const defaultRate = await prisma.pRP_DON_GIA_DIEN_NUOC.create({
          data: {
            gia_dien: 3000, // 3000 VNĐ/kWh
            gia_nuoc: 25000, // 25000 VNĐ/m³
            phuong_thuc_tinh_nuoc: 'DONG_HO',
            gia_nuoc_theo_nguoi: null,
            su_dung_bac_thang: false,
            la_chung: true,
          },
          include: {
            bac_thang_gia: {
              orderBy: { muc_tieu_thu_min: 'asc' }
            }
          }
        });
        return NextResponse.json(defaultRate);
      }

      return NextResponse.json(globalRate);
    }

    // Property Owner: get property-specific utility rate (for their own property)
    // Find property-specific utility rate (not global, not room-specific)
    const propertyRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findFirst({
      where: {
        nguoi_dung_id: session.user.id,
        la_chung: true,
        phong_id: null
      },
      include: {
        bac_thang_gia: {
          orderBy: { muc_tieu_thu_min: 'asc' }
        }
      }
    });

    return NextResponse.json(propertyRate || null);
  } catch (error) {
    console.error('Error fetching utility rates:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy đơn giá' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/utility-rates - Cập nhật đơn giá chung (Super Admin) hoặc property utility rate (Property Owner)
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateGlobalUtilityRateSchema.parse(body);

    // Super Admin: update global rate
    if (isSuperAdmin(session)) {

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

      // Tìm đơn giá chung hiện tại
      let globalRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findFirst({
        where: { la_chung: true, nguoi_dung_id: null }
      });

      if (!globalRate) {
        // Tạo mới nếu chưa có
        globalRate = await prisma.pRP_DON_GIA_DIEN_NUOC.create({
          data: {
            ...validatedData,
            la_chung: true,
          }
        });
      } else {
        // Cập nhật trong transaction để đảm bảo consistency
        await prisma.$transaction(async (tx) => {
          // Xóa các bậc thang cũ nếu có
          if (validatedData.bac_thang_gia !== undefined) {
            await tx.pRP_BAC_THANG_GIA_DIEN.deleteMany({
              where: { don_gia_id: globalRate.id }
            });
          }

          // Cập nhật đơn giá chung
          globalRate = await tx.pRP_DON_GIA_DIEN_NUOC.update({
            where: { id: globalRate.id },
            data: {
              gia_dien: validatedData.gia_dien,
              gia_nuoc: validatedData.gia_nuoc,
              phuong_thuc_tinh_nuoc: validatedData.phuong_thuc_tinh_nuoc,
              gia_nuoc_theo_nguoi: validatedData.gia_nuoc_theo_nguoi,
              su_dung_bac_thang: validatedData.su_dung_bac_thang,
            }
          });

          // Tạo các bậc thang mới nếu có
          if (validatedData.su_dung_bac_thang && validatedData.bac_thang_gia) {
            await tx.pRP_BAC_THANG_GIA_DIEN.createMany({
              data: validatedData.bac_thang_gia.map(rate => ({
                ...rate,
                don_gia_id: globalRate.id
              }))
            });
          }
        });
      }

      // Lấy dữ liệu đầy đủ để trả về
      const updatedRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
        where: { id: globalRate.id },
        include: {
          bac_thang_gia: {
            orderBy: { muc_tieu_thu_min: 'asc' }
          }
        }
      });

      return NextResponse.json(updatedRate);
    }

    // Property Owner: update property-specific utility rate (for their own property)
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

    // Tìm property utility rate hiện tại
    let propertyRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findFirst({
      where: {
        nguoi_dung_id: session.user.id,
        la_chung: true,
        phong_id: null
      }
    });

    if (!propertyRate) {
      // Tạo mới nếu chưa có
      propertyRate = await prisma.pRP_DON_GIA_DIEN_NUOC.create({
        data: {
          ...validatedData,
          nguoi_dung_id: session.user.id,
          la_chung: true, // Force la_chung=true for property default
          phong_id: null,
        }
      });

      // Tạo các bậc thang nếu có
      if (validatedData.su_dung_bac_thang && validatedData.bac_thang_gia && validatedData.bac_thang_gia.length > 0) {
        await prisma.pRP_BAC_THANG_GIA_DIEN.createMany({
          data: validatedData.bac_thang_gia.map(rate => ({
            ...rate,
            don_gia_id: propertyRate.id
          }))
        });
      }
    } else {
      // Cập nhật trong transaction
      await prisma.$transaction(async (tx) => {
        // Xóa các bậc thang cũ nếu có
        if (validatedData.bac_thang_gia !== undefined) {
          await tx.pRP_BAC_THANG_GIA_DIEN.deleteMany({
            where: { don_gia_id: propertyRate.id }
          });
        }

        // Cập nhật property utility rate
        propertyRate = await tx.pRP_DON_GIA_DIEN_NUOC.update({
          where: { id: propertyRate.id },
          data: {
            gia_dien: validatedData.gia_dien,
            gia_nuoc: validatedData.gia_nuoc,
            phuong_thuc_tinh_nuoc: validatedData.phuong_thuc_tinh_nuoc,
            gia_nuoc_theo_nguoi: validatedData.gia_nuoc_theo_nguoi,
            su_dung_bac_thang: validatedData.su_dung_bac_thang,
            la_chung: true, // Force la_chung=true for property default
          }
        });

        // Tạo các bậc thang mới nếu có
        if (validatedData.su_dung_bac_thang && validatedData.bac_thang_gia && validatedData.bac_thang_gia.length > 0) {
          await tx.pRP_BAC_THANG_GIA_DIEN.createMany({
            data: validatedData.bac_thang_gia.map(rate => ({
              ...rate,
              don_gia_id: propertyRate.id
            }))
          });
        }
      });
    }

    // Lấy dữ liệu đầy đủ để trả về
    const updatedRate = await prisma.pRP_DON_GIA_DIEN_NUOC.findUnique({
      where: { id: propertyRate.id },
      include: {
        bac_thang_gia: {
          orderBy: { muc_tieu_thu_min: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedRate);
  } catch (error) {
    console.error('Error updating global utility rates:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Lỗi khi cập nhật đơn giá chung' },
      { status: 500 }
    );
  }
}
