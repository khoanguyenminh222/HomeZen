import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { 
  roomUtilityRateSchema, 
  updateRoomUtilityRateSchema,
  validateTieredRates 
} from '@/lib/validations/utilityRate';

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
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Tìm đơn giá riêng của phòng
    const roomRate = await prisma.utilityRate.findUnique({
      where: { roomId },
      include: {
        tieredRates: {
          orderBy: { minUsage: 'asc' }
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
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Validate input
    const validatedData = updateRoomUtilityRateSchema.parse(body);

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

    // Tìm đơn giá riêng hiện tại
    let roomRate = await prisma.utilityRate.findUnique({
      where: { roomId }
    });

    if (!roomRate) {
      // Tạo mới nếu chưa có
      const createData = {
        roomId,
        isGlobal: false,
        electricityPrice: validatedData.electricityPrice || null,
        waterPrice: validatedData.waterPrice || null,
        waterPricingMethod: validatedData.waterPricingMethod || 'METER',
        waterPricePerPerson: validatedData.waterPricePerPerson || null,
        useTieredPricing: validatedData.useTieredPricing || false,
      };

      roomRate = await prisma.utilityRate.create({
        data: createData
      });

      // Tạo các bậc thang nếu có
      if (validatedData.useTieredPricing && validatedData.tieredRates && validatedData.tieredRates.length > 0) {
        await prisma.tieredElectricityRate.createMany({
          data: validatedData.tieredRates.map(rate => ({
            ...rate,
            utilityRateId: roomRate.id
          }))
        });
      }
    } else {
      // Cập nhật trong transaction để đảm bảo consistency
      await prisma.$transaction(async (tx) => {
        // Xóa các bậc thang cũ nếu có
        if (validatedData.tieredRates !== undefined) {
          await tx.tieredElectricityRate.deleteMany({
            where: { utilityRateId: roomRate.id }
          });
        }

        // Cập nhật đơn giá riêng
        roomRate = await tx.utilityRate.update({
          where: { id: roomRate.id },
          data: {
            electricityPrice: validatedData.electricityPrice !== undefined ? validatedData.electricityPrice : roomRate.electricityPrice,
            waterPrice: validatedData.waterPrice !== undefined ? validatedData.waterPrice : roomRate.waterPrice,
            waterPricingMethod: validatedData.waterPricingMethod || roomRate.waterPricingMethod,
            waterPricePerPerson: validatedData.waterPricePerPerson !== undefined ? validatedData.waterPricePerPerson : roomRate.waterPricePerPerson,
            useTieredPricing: validatedData.useTieredPricing !== undefined ? validatedData.useTieredPricing : roomRate.useTieredPricing,
          }
        });

        // Tạo các bậc thang mới nếu có
        if (validatedData.useTieredPricing && validatedData.tieredRates && validatedData.tieredRates.length > 0) {
          await tx.tieredElectricityRate.createMany({
            data: validatedData.tieredRates.map(rate => ({
              ...rate,
              utilityRateId: roomRate.id
            }))
          });
        }
      });
    }

    // Lấy dữ liệu đầy đủ để trả về
    const updatedRate = await prisma.utilityRate.findUnique({
      where: { id: roomRate.id },
      include: {
        tieredRates: {
          orderBy: { minUsage: 'asc' }
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
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Không tìm thấy phòng' },
        { status: 404 }
      );
    }

    // Tìm và xóa đơn giá riêng
    const roomRate = await prisma.utilityRate.findUnique({
      where: { roomId }
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
      await tx.tieredElectricityRate.deleteMany({
        where: { utilityRateId: roomRate.id }
      });

      // Xóa đơn giá riêng
      await tx.utilityRate.delete({
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