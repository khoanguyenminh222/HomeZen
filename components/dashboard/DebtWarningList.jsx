'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Danh sách cảnh báo nợ (nợ 2 tháng liên tiếp trở lên)
 * Requirements: 13.9, 18.6
 */
export default function DebtWarningList() {
    const [warnings, setWarnings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchWarnings() {
            try {
                const response = await fetch('/api/debt/warnings');
                if (response.ok) {
                    const data = await response.json();
                    setWarnings(Array.isArray(data) ? data : []);
                } else {
                    console.error('Failed to fetch debt warnings:', response.statusText);
                    setWarnings([]);
                }
            } catch (error) {
                console.error('Lỗi khi tải cảnh báo nợ:', error);
                setWarnings([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWarnings();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cảnh Báo Nợ</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card className={warnings.length > 0 ? "border-red-200 dark:border-red-900" : ""}>
            <CardHeader>
                <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Cảnh Báo Nợ
                </CardTitle>
            </CardHeader>
            <CardContent>
                {warnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Không có phòng nào nợ quá hạn nguy hiểm.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {warnings.map((warning) => (
                            <div key={warning.roomId} className="flex items-center justify-between border-b border-red-100 dark:border-red-900 pb-3 last:border-0 last:pb-0">
                                <div>
                                    <div className="font-bold text-red-600 dark:text-red-400">Phòng {warning.roomCode}</div>
                                    <div className="text-xs text-red-500 dark:text-red-400">
                                        Nợ {warning.consecutiveMonths} tháng liên tiếp
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-600 dark:text-red-400">{formatCurrency(warning.totalDebt)}</div>
                                    <Link href={`/rooms/${warning.roomId}`} className="text-xs underline hover:text-primary">
                                        Xem chi tiết
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
