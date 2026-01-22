'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { Home, Users, FileText, DollarSign, Wallet } from 'lucide-react';

/**
 * Hiển thị các thẻ thống kê tổng quan
 * Requirements: 13.2-13.5
 */
export default function DashboardStats({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Phòng trống */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Phòng Trống</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.emptyRooms} / {stats.totalRooms}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.occupiedRooms} phòng đang cho thuê
                    </p>
                </CardContent>
            </Card>

            {/* Hóa đơn chưa thu */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hóa Đơn Chưa Thu</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.unpaidBillsCount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Tổng cộng: {formatCurrency(stats.totalUnpaidAmount)}
                    </p>
                </CardContent>
            </Card>

            {/* Doanh thu tháng này */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Doanh Thu Tháng {stats.currentMonth}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(stats.monthlyRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Từ các hóa đơn đã thanh toán
                    </p>
                </CardContent>
            </Card>

            {/* Tổng nợ tích lũy */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Nợ Tích Lũy</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(stats.totalDebt)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Tất cả các phòng
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
