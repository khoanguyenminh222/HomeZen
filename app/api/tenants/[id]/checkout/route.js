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
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                room: true
            }
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Không tìm thấy người thuê' },
                { status: 404 }
            );
        }

        if (!tenant.roomId) {
            return NextResponse.json(
                { error: 'Người thuê này hiện không ở phòng nào' },
                { status: 400 }
            );
        }

        // Kiểm tra phòng còn nợ không
        let totalDebt = await calculateTotalDebt(tenant.roomId);
        
        // Nếu có depositReturn và method là DEDUCT_FROM_LAST_BILL, tính toán lại nợ sau khi trừ tiền cọc
        if (body.depositReturn) {
            const depositData = depositReturnSchema.parse(body.depositReturn);
            
            if (depositData.method === 'DEDUCT_FROM_LAST_BILL') {
                // Lấy tất cả các hóa đơn còn nợ, sắp xếp từ mới đến cũ
                const unpaidBills = await prisma.bill.findMany({
                    where: {
                        roomId: tenant.roomId
                    },
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ],
                    select: {
                        id: true,
                        totalCost: true,
                        paidAmount: true,
                    }
                });

                // Tính toán lại tổng nợ sau khi trừ tiền cọc vào các hóa đơn còn nợ
                let remainingDeposit = depositData.amount;
                
                for (const bill of unpaidBills) {
                    if (remainingDeposit <= 0) break;
                    
                    const totalCost = Number(bill.totalCost);
                    const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
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
                if (depositData.method === 'DEDUCT_FROM_LAST_BILL') {
                    // Lấy tất cả các hóa đơn còn nợ, sắp xếp từ mới đến cũ
                    const unpaidBills = await tx.bill.findMany({
                        where: {
                            roomId: tenant.roomId
                        },
                        orderBy: [
                            { year: 'desc' },
                            { month: 'desc' }
                        ],
                        select: {
                            id: true,
                            totalCost: true,
                            paidAmount: true,
                            paidDate: true,
                        }
                    });

                    // Áp dụng tiền cọc vào các hóa đơn còn nợ theo thứ tự từ mới đến cũ
                    let remainingDeposit = depositData.amount;
                    let totalAppliedToBills = 0;
                    
                    for (const bill of unpaidBills) {
                        if (remainingDeposit <= 0) break;
                        
                        const totalCost = Number(bill.totalCost);
                        const currentPaidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
                        const billRemainingDebt = Math.max(0, totalCost - currentPaidAmount);
                        
                        if (billRemainingDebt > 0) {
                            // Số tiền cọc được áp dụng vào hóa đơn này
                            const appliedAmount = Math.min(remainingDeposit, billRemainingDebt);
                            const newPaidAmount = currentPaidAmount + appliedAmount;
                            
                            // Cập nhật paidAmount của hóa đơn
                            await tx.bill.update({
                                where: { id: bill.id },
                                data: {
                                    paidAmount: newPaidAmount,
                                    // Nếu số tiền đã thanh toán >= tổng tiền, đánh dấu là đã thanh toán
                                    isPaid: newPaidAmount >= totalCost,
                                    paidDate: newPaidAmount >= totalCost 
                                        ? (bill.paidDate || new Date())
                                        : bill.paidDate
                                }
                            });
                            
                            remainingDeposit -= appliedAmount;
                            totalAppliedToBills += appliedAmount;
                        }
                    }
                    
                    // Tạo record hoàn trả cho phần đã trừ vào nợ (nếu có)
                    if (totalAppliedToBills > 0) {
                        await tx.depositReturn.create({
                            data: {
                                amount: totalAppliedToBills,
                                method: 'DEDUCT_FROM_LAST_BILL',
                                notes: depositData.notes || `Đã trừ ${totalAppliedToBills} vào các hóa đơn còn nợ`,
                                tenantId: tenant.id
                            }
                        });
                    }
                    
                    // Nếu còn dư tiền cọc sau khi trừ vào nợ, tạo record hoàn trả cho phần dư
                    if (remainingDeposit > 0) {
                        await tx.depositReturn.create({
                            data: {
                                amount: remainingDeposit,
                                method: 'FULL_RETURN',
                                notes: `Phần dư tiền cọc sau khi trừ vào các hóa đơn còn nợ. Tổng tiền cọc: ${depositData.amount}, đã trừ vào nợ: ${totalAppliedToBills}`,
                                tenantId: tenant.id
                            }
                        });
                    }
                } else {
                    // Nếu là FULL_RETURN, tạo record như bình thường
                    await tx.depositReturn.create({
                        data: {
                            amount: depositData.amount,
                            method: depositData.method,
                            notes: depositData.notes || null,
                            tenantId: tenant.id
                        }
                    });
                }
            }

            // 2. Cập nhật trạng thái phòng thành EMPTY
            await tx.room.update({
                where: { id: tenant.roomId },
                data: { status: 'EMPTY' }
            });

            // 3. Unlink người thuê khỏi phòng (set roomId = null)
            await tx.tenant.update({
                where: { id },
                data: { roomId: null }
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
