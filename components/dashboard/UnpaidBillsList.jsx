'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

/**
 * Danh sách hóa đơn chưa thanh toán
 * Requirements: 13.4, 13.8
 */
export default function UnpaidBillsList() {
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUnpaidBills() {
            try {
                // Lấy danh sách hóa đơn chưa thanh toán (bao gồm cả thanh toán một phần)
                const response = await fetch('/api/bills?status=unpaid');
                if (response.ok) {
                    const data = await response.json();
                    // API trả về array trực tiếp, lấy 5 hóa đơn đầu tiên
                    const unpaidBills = Array.isArray(data) ? data : [];
                    setBills(unpaidBills.slice(0, 5));
                }
            } catch (error) {
                console.error('Lỗi khi tải hóa đơn chưa thanh toán:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUnpaidBills();
    }, []);

    if (isLoading) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Hóa Đơn Chưa Thanh Toán</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Hóa Đơn Chưa Thanh Toán</CardTitle>
                <Link href="/bills?status=unpaid" className="text-sm text-primary hover:underline flex items-center">
                    Xem tất cả <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent>
                {bills.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        Không có hóa đơn nào chưa thanh toán.
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        {bills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                    <div className="font-medium flex items-center">
                                        Phòng {bill.room?.code}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({bill.month}/{bill.year})
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {bill.tenantName || 'Không có người thuê'}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="font-bold text-orange-600 dark:text-orange-400">
                                        {formatCurrency(bill.totalCost)}
                                    </div>
                                    <Link href={`/bills/${bill.id}`}>
                                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                                            Xem chi tiết
                                        </Badge>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
