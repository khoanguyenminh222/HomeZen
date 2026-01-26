'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

/**
 * Biểu đồ đường thể hiện doanh thu 6 tháng gần nhất
 * Requirements: 13.11
 */
export default function RevenueChart({ userId }) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRevenue() {
            setIsLoading(true);
            try {
                const url = userId
                    ? `/api/dashboard/revenue?userId=${userId}`
                    : '/api/dashboard/revenue';
                const response = await fetch(url);
                if (response.ok) {
                    const revenueData = await response.json();
                    setData(revenueData);
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu doanh thu:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRevenue();
    }, [userId]);

    if (isLoading || !data) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Doanh Thu 6 Tháng Gần Nhất</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    const chartData = {
        labels: data.map(item => item.label),
        datasets: [
            {
                label: 'Doanh Thu (VNĐ)',
                data: data.map(item => item.totalRevenue),
                borderColor: 'rgb(59, 130, 246)', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3, // Smooth curve
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return new Intl.NumberFormat('vi-VN', {
                            notation: "compact",
                            compactDisplay: "short"
                        }).format(value);
                    }
                }
            }
        }
    };

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Doanh Thu 6 Tháng Gần Nhất</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <Line data={chartData} options={options} />
                </div>
            </CardContent>
        </Card>
    );
}
