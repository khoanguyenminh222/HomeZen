import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/dashboard/revenue
 * Lấy dữ liệu doanh thu 6 tháng gần nhất
 * Requirements: 13.11
 */
export async function GET() {
    try {
        const currentDate = new Date();
        const revenueData = [];

        // Lấy dữ liệu 6 tháng gần nhất
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setMonth(date.getMonth() - i);

            const month = date.getMonth() + 1; // 1-12
            const year = date.getFullYear();

            // Lấy tất cả hóa đơn của tháng này
            const bills = await prisma.bill.findMany({
                where: {
                    month: month,
                    year: year,
                },
                select: {
                    totalCost: true,
                    isPaid: true,
                    paidAmount: true,
                }
            });

            // Tính doanh thu (chỉ tính hóa đơn đã thanh toán)
            const paidBills = bills.filter(bill => bill.isPaid);
            const totalRevenue = paidBills.reduce((sum, bill) => {
                const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : Number(bill.totalCost);
                return sum + paidAmount;
            }, 0);

            // Đếm số hóa đơn
            const paidBillsCount = paidBills.length;
            const unpaidBillsCount = bills.filter(bill => !bill.isPaid).length;

            revenueData.push({
                month,
                year,
                totalRevenue,
                paidBillsCount,
                unpaidBillsCount,
                label: `${month}/${year}`, // Nhãn cho biểu đồ
            });
        }

        return NextResponse.json(revenueData);
    } catch (error) {
        console.error('Lỗi API /api/dashboard/revenue:', error);
        return NextResponse.json(
            { error: 'Không thể tải dữ liệu doanh thu' },
            { status: 500 }
        );
    }
}
