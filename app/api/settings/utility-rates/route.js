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
      // Tìm đơn giá chung (isGlobal = true)
      const globalRate = await prisma.utilityRate.findFirst({
        where: { isGlobal: true, userId: null },
        include: {
          tieredRates: {
            orderBy: { minUsage: 'asc' }
          }
        }
      });

      if (!globalRate) {
        // Tạo đơn giá chung mặc định nếu chưa có
        const defaultRate = await prisma.utilityRate.create({
          data: {
            electricityPrice: 3000, // 3000 VNĐ/kWh
            waterPrice: 25000, // 25000 VNĐ/m³
            waterPricingMethod: 'METER',
            waterPricePerPerson: null,
            useTieredPricing: false,
            isGlobal: true,
          },
          include: {
            tieredRates: {
              orderBy: { minUsage: 'asc' }
            }
          }
        });
        return NextResponse.json(defaultRate);
      }

      return NextResponse.json(globalRate);
    }

    // Property Owner: get property-specific utility rate (for their own property)
    // Find property-specific utility rate (not global, not room-specific)
    const propertyRate = await prisma.utilityRate.findFirst({
      where: {
        userId: session.user.id,
        userId: session.user.id,
        isGlobal: true,
        roomId: null
      },
      include: {
        tieredRates: {
          orderBy: { minUsage: 'asc' }
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
      if (validatedData.useTieredPricing && validatedData.tieredRates) {
        const validation = validateTieredRates(validatedData.tieredRates);
        if (!validation.isValid) {
          return NextResponse.json(
            { error: validation.error },
            { status: 400 }
          );
        }
        validatedData.tieredRates = validation.sortedRates;
      }

      // Tìm đơn giá chung hiện tại
      let globalRate = await prisma.utilityRate.findFirst({
        where: { isGlobal: true, userId: null }
      });

      if (!globalRate) {
        // Tạo mới nếu chưa có
        globalRate = await prisma.utilityRate.create({
          data: {
            ...validatedData,
            isGlobal: true,
          }
        });
      } else {
        // Cập nhật trong transaction để đảm bảo consistency
        await prisma.$transaction(async (tx) => {
          // Xóa các bậc thang cũ nếu có
          if (validatedData.tieredRates !== undefined) {
            await tx.tieredElectricityRate.deleteMany({
              where: { utilityRateId: globalRate.id }
            });
          }

          // Cập nhật đơn giá chung
          globalRate = await tx.utilityRate.update({
            where: { id: globalRate.id },
            data: {
              electricityPrice: validatedData.electricityPrice,
              waterPrice: validatedData.waterPrice,
              waterPricingMethod: validatedData.waterPricingMethod,
              waterPricePerPerson: validatedData.waterPricePerPerson,
              useTieredPricing: validatedData.useTieredPricing,
            }
          });

          // Tạo các bậc thang mới nếu có
          if (validatedData.useTieredPricing && validatedData.tieredRates) {
            await tx.tieredElectricityRate.createMany({
              data: validatedData.tieredRates.map(rate => ({
                ...rate,
                utilityRateId: globalRate.id
              }))
            });
          }
        });
      }

      // Lấy dữ liệu đầy đủ để trả về
      const updatedRate = await prisma.utilityRate.findUnique({
        where: { id: globalRate.id },
        include: {
          tieredRates: {
            orderBy: { minUsage: 'asc' }
          }
        }
      });

      return NextResponse.json(updatedRate);
    }

    // Property Owner: update property-specific utility rate (for their own property)
    // Validate tiered rates nếu có
    if (validatedData.useTieredPricing && validatedData.tieredRates) {
      const validation = validateTieredRates(validatedData.tieredRates);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      validatedData.tieredRates = validation.sortedRates;
    }

    // Tìm property utility rate hiện tại
    let propertyRate = await prisma.utilityRate.findFirst({
      where: {
        userId: session.user.id,
        userId: session.user.id,
        isGlobal: true,
        roomId: null
      }
    });

    if (!propertyRate) {
      // Tạo mới nếu chưa có
      propertyRate = await prisma.utilityRate.create({
        data: {
          ...validatedData,
          userId: session.user.id,
          isGlobal: false,
          roomId: null,
        }
      });

      // Tạo các bậc thang nếu có
      if (validatedData.useTieredPricing && validatedData.tieredRates && validatedData.tieredRates.length > 0) {
        await prisma.tieredElectricityRate.createMany({
          data: validatedData.tieredRates.map(rate => ({
            ...rate,
            utilityRateId: propertyRate.id
          }))
        });
      }
    } else {
      // Cập nhật trong transaction
      await prisma.$transaction(async (tx) => {
        // Xóa các bậc thang cũ nếu có
        if (validatedData.tieredRates !== undefined) {
          await tx.tieredElectricityRate.deleteMany({
            where: { utilityRateId: propertyRate.id }
          });
        }

        // Cập nhật property utility rate
        propertyRate = await tx.utilityRate.update({
          where: { id: propertyRate.id },
          data: {
            electricityPrice: validatedData.electricityPrice,
            waterPrice: validatedData.waterPrice,
            waterPricingMethod: validatedData.waterPricingMethod,
            waterPricePerPerson: validatedData.waterPricePerPerson,
            useTieredPricing: validatedData.useTieredPricing,
            isGlobal: true, // Force isGlobal=true for property default
          }
        });

        // Tạo các bậc thang mới nếu có
        if (validatedData.useTieredPricing && validatedData.tieredRates && validatedData.tieredRates.length > 0) {
          await tx.tieredElectricityRate.createMany({
            data: validatedData.tieredRates.map(rate => ({
              ...rate,
              utilityRateId: propertyRate.id
            }))
          });
        }
      });
    }

    // Lấy dữ liệu đầy đủ để trả về
    const updatedRate = await prisma.utilityRate.findUnique({
      where: { id: propertyRate.id },
      include: {
        tieredRates: {
          orderBy: { minUsage: 'asc' }
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