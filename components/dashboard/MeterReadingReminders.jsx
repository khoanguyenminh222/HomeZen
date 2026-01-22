'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Nhắc nhở chốt số điện nước
 * Requirements: 13.6-13.8
 */
export default function MeterReadingReminders() {
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReminders() {
            try {
                const response = await fetch('/api/dashboard/reminders');
                if (response.ok) {
                    const data = await response.json();
                    setReminders(data);
                }
            } catch (error) {
                console.error('Lỗi khi tải nhắc nhở:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchReminders();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Nhắc Nhở Chốt Số</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-4 w-4 text-yellow-500" />
                    Cần Chốt Số Hôm Nay
                </CardTitle>
                {reminders.length > 0 && (
                    <Badge variant="secondary" className="rounded-full px-2">
                        {reminders.length}
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                {reminders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Không có phòng nào cần chốt số hôm nay.
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        {reminders.map((room) => (
                            <div key={room.roomId} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                <div>
                                    <div className="font-medium">Phòng {room.roomCode}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Ngày chốt: {room.meterReadingDay} hàng tháng
                                        {room.daysOverdue > 0 && (
                                            <span className="text-red-500 ml-1">
                                                (Trễ {room.daysOverdue} ngày)
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {room.tenantName} - {room.tenantPhone}
                                    </div>
                                </div>
                                <Link href={`/bills/create?roomId=${room.roomId}`}>
                                    <Button size="sm" variant="outline" className="h-8">
                                        <PlusCircle className="mr-1 h-3 w-3" />
                                        Tạo Bill
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
