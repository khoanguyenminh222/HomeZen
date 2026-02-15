import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { depositReturnSchema } from '@/lib/validations/tenant';
import { calculateTotalDebt } from '@/lib/debt/calculateTotalDebt';

// POST /api/tenants/[id]/checkout - Trả phòng (Hủy liên kết phòng)
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json().catch(() => ({}));

        // Kiểm tra người thuê có tồn tại không
        const tenant = await prisma.tNT_NGUOI_THUE_CHINH.findUnique({
            where: { id },
            include: {
                phong: true
            }
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Không tìm thấy người thuê' },
                { status: 404 }
            );
        }

        if (!tenant.phong_id) {
            return NextResponse.json(
                { error: 'Người thuê này hiện không ở phòng nào' },
                { status: 400 }
            );
        }

        // Kiểm tra phòng còn nợ không
        let totalDebt = await calculateTotalDebt(tenant.phong_id);

        // Nếu có depositReturn và loai_hoan_tra là TRU_VAO_HOA_DON_CUOI, tính toán lại nợ sau khi trừ tiền cọc
        if (body.depositReturn) {
            const depositData = depositReturnSchema.parse(body.depositReturn);

            if (depositData.loai_hoan_tra === 'TRU_VAO_HOA_DON_CUOI') {
                // Lấy tất cả các hóa đơn còn nợ, sắp xếp từ mới đến cũ
                const unpaidBills = await prisma.bIL_HOA_DON.findMany({
                    where: {
                        phong_id: tenant.phong_id
                    },
                    orderBy: [
                        { nam: 'desc' },
                        { thang: 'desc' }
                    ],
                    select: {
                        id: true,
                        tong_tien: true,
                        so_tien_da_tra: true,
                    }
                });

                // Tính toán lại tổng nợ sau khi trừ tiền cọc vào các hóa đơn còn nợ
                let remainingDeposit = depositData.so_tien;

                for (const bill of unpaidBills) {
                    if (remainingDeposit <= 0) break;

                    const totalCost = Number(bill.tong_tien);
                    const paidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
                    const billRemainingDebt = Math.max(0, totalCost - paidAmount);

                    if (billRemainingDebt > 0) {
                        // Số tiền cọc được áp dụng vào hóa đơn này
                        const appliedAmount = Math.min(remainingDeposit, billRemainingDebt);
                        totalDebt = Math.max(0, totalDebt - appliedAmount);
                        remainingDeposit -= appliedAmount;
                    }
                }
            }
        }

        // Kiểm tra nợ sau khi tính toán
        if (totalDebt > 0) {
            return NextResponse.json(
                {
                    error: 'Không thể trả phòng khi còn nợ',
                    debtAmount: totalDebt,
                    message: `Phòng này còn nợ ${totalDebt.toLocaleString('vi-VN')} VNĐ. Vui lòng thanh toán hết nợ trước khi trả phòng.`
                },
                { status: 400 }
            );
        }

        // Xử lý trong transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Tạo record hoàn trả cọc nếu có thông tin
            if (body.depositReturn) {
                const depositData = depositReturnSchema.parse(body.depositReturn);

                // Nếu phương thức là "Trừ vào hóa đơn cuối", áp dụng vào các hóa đơn còn nợ (từ mới đến cũ)
                if (depositData.loai_hoan_tra === 'TRU_VAO_HOA_DON_CUOI') {
                    // Lấy tất cả các hóa đơn còn nợ, sắp xếp từ mới đến cũ
                    const unpaidBills = await tx.bIL_HOA_DON.findMany({
                        where: {
                            phong_id: tenant.phong_id
                        },
                        orderBy: [
                            { nam: 'desc' },
                            { thang: 'desc' }
                        ],
                        select: {
                            id: true,
                            tong_tien: true,
                            so_tien_da_tra: true,
                            ngay_thanh_toan: true,
                        }
                    });

                    // Áp dụng tiền cọc vào các hóa đơn còn nợ theo thứ tự từ mới đến cũ
                    let remainingDeposit = depositData.so_tien;
                    let totalAppliedToBills = 0;

                    for (const bill of unpaidBills) {
                        if (remainingDeposit <= 0) break;

                        const totalCost = Number(bill.tong_tien);
                        const currentPaidAmount = bill.so_tien_da_tra ? Number(bill.so_tien_da_tra) : 0;
                        const billRemainingDebt = Math.max(0, totalCost - currentPaidAmount);

                        if (billRemainingDebt > 0) {
                            // Số tiền cọc được áp dụng vào hóa đơn này
                            const appliedAmount = Math.min(remainingDeposit, billRemainingDebt);
                            const newPaidAmount = currentPaidAmount + appliedAmount;

                            // Cập nhật so_tien_da_thanh_toan của hóa đơn
                            await tx.bIL_HOA_DON.update({
                                where: { id: bill.id },
                                data: {
                                    so_tien_da_tra: newPaidAmount,
                                    da_thanh_toan: newPaidAmount >= totalCost,
                                    ngay_thanh_toan: newPaidAmount >= totalCost
                                        ? (bill.ngay_thanh_toan || new Date())
                                        : bill.ngay_thanh_toan
                                }
                            });

                            remainingDeposit -= appliedAmount;
                            totalAppliedToBills += appliedAmount;
                        }
                    }

                    // Tạo record hoàn trả cho phần đã trừ vào nợ (nếu có)
                    if (totalAppliedToBills > 0) {
                        await tx.tNT_LICH_SU_HOAN_TRA_COC.create({
                            data: {
                                so_tien: totalAppliedToBills,
                                phuong_thuc: 'TRU_VAO_HOA_DON_CUOI',
                                ghi_chu: depositData.ghi_chu || `Đã trừ ${totalAppliedToBills} vào các hóa đơn còn nợ`,
                                nguoi_thue_id: tenant.id
                            }
                        });
                    }

                    // Nếu còn dư tiền cọc sau khi trừ vào nợ, tạo record hoàn trả cho phần dư
                    if (remainingDeposit > 0) {
                        await tx.tNT_LICH_SU_HOAN_TRA_COC.create({
                            data: {
                                so_tien: remainingDeposit,
                                phuong_thuc: 'HOAN_TRA_DAY_DU',
                                ghi_chu: `Phần dư tiền cọc sau khi trừ vào các hóa đơn còn nợ. Tổng tiền cọc: ${depositData.so_tien}, đã trừ vào nợ: ${totalAppliedToBills}`,
                                nguoi_thue_id: tenant.id
                            }
                        });
                    }
                } else {
                    // Nếu là HOAN_TRA_DAY_DU, tạo record như bình thường
                    await tx.tNT_LICH_SU_HOAN_TRA_COC.create({
                        data: {
                            so_tien: depositData.so_tien,
                            phuong_thuc: depositData.loai_hoan_tra,
                            ghi_chu: depositData.ghi_chu || null,
                            nguoi_thue_id: tenant.id
                        }
                    });
                }
            }

            // 2. Cập nhật trạng thái phòng thành TRONG
            await tx.pRP_PHONG.update({
                where: { id: tenant.phong_id },
                data: { trang_thai: 'TRONG' }
            });

            // 3. Unlink người thuê khỏi phòng (set phong_id = null)
            await tx.tNT_NGUOI_THUE_CHINH.update({
                where: { id },
                data: { phong_id: null }
            });

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking out tenant:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    error: 'Thông tin hoàn trả cọc không hợp lệ',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Lỗi khi thực hiện trả phòng' },
            { status: 500 }
        );
    }
}
