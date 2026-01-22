'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Biểu đồ tròn thể hiện trạng thái phòng
 * Requirements: 13.2, 13.3
 */
export default function RoomStatusChart({ stats }) {
    if (!stats) return null;

    const data = {
        labels: ['Phòng Trống', 'Đã Cho Thuê'],
        datasets: [
            {
                data: [stats.emptyRooms, stats.occupiedRooms],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.2)', // Green for empty
                    'rgba(59, 130, 246, 0.2)', // Blue for occupied
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Trạng Thái Phòng</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <Doughnut data={data} options={options} />
                </div>
            </CardContent>
        </Card>
    );
}
