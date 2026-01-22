'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Droplets } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * MeterHistoryChart - Biểu đồ lịch sử chỉ số điện nước
 * Requirements: 17.4-17.8
 * Best Practice: Tách thành 2 biểu đồ riêng để dễ nhìn và so sánh
 */
export default function MeterHistoryChart({ history }) {
  const electricChartRef = useRef(null);
  const waterChartRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 sm:py-12 px-4 sm:px-6">
          <div className="text-center">
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
              Chưa có dữ liệu để hiển thị biểu đồ
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const labels = history.map(item => item.date);
  const electricUsage = history.map(item => item.electric.usage);
  const waterUsage = history.map(item => item.water.usage);

  // Calculate min/max for better scaling
  const electricMax = Math.max(...electricUsage, 1);
  const electricMin = Math.min(...electricUsage, 0);
  const waterMax = Math.max(...waterUsage, 1);
  const waterMin = Math.min(...waterUsage, 0);

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // Hide legend for individual charts
      },
      tooltip: {
        padding: 8,
        titleFont: {
          size: isMobile ? 12 : 13,
        },
        bodyFont: {
          size: isMobile ? 11 : 12,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Tháng/Năm',
          font: {
            size: isMobile ? 11 : 12,
          },
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 11,
          },
        },
      },
    },
  };

  // Electric chart data and options - Màu vàng dịu (amber-500)
  const electricChartData = {
    labels,
    datasets: [
      {
        label: 'Điện (kWh)',
        data: electricUsage,
        borderColor: 'rgb(245, 158, 11)', // amber-500 - vàng dịu, không chói
        backgroundColor: 'rgba(245, 158, 11, 0.12)', // opacity thấp hơn để dịu mắt
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const electricChartOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Điện (kWh)',
          font: {
            size: isMobile ? 11 : 12,
            weight: 'bold',
          },
          color: 'rgb(217, 119, 6)', // amber-600 - đậm hơn một chút cho dễ đọc
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 11,
          },
          color: 'rgb(217, 119, 6)', // amber-600
        },
        beginAtZero: true,
        suggestedMax: electricMax > 0 ? electricMax * 1.15 : undefined,
        suggestedMin: 0,
        grid: {
          color: 'rgba(245, 158, 11, 0.08)', // grid nhạt hơn để không chói
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const index = context.dataIndex;
            const item = history[index];
            const rollover = item.electric.rollover ? ' (Xoay vòng)' : '';
            return `Điện: ${value} kWh${rollover}`;
          },
        },
      },
    },
  };

  // Water chart data and options - Màu xanh dương dịu (blue-500)
  const waterChartData = {
    labels,
    datasets: [
      {
        label: 'Nước (m³)',
        data: waterUsage,
        borderColor: 'rgb(59, 130, 246)', // blue-500 - xanh dương dịu, dễ nhìn
        backgroundColor: 'rgba(59, 130, 246, 0.12)', // opacity thấp hơn để dịu mắt
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const waterChartOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Nước (m³)',
          font: {
            size: isMobile ? 11 : 12,
            weight: 'bold',
          },
          color: 'rgb(37, 99, 235)', // blue-600 - đậm hơn một chút cho dễ đọc
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 11,
          },
          color: 'rgb(37, 99, 235)', // blue-600
        },
        beginAtZero: true,
        suggestedMax: waterMax > 0 ? waterMax * 1.15 : undefined,
        suggestedMin: 0,
        grid: {
          color: 'rgba(59, 130, 246, 0.08)', // grid nhạt hơn để không chói
        },
      },
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const index = context.dataIndex;
            const item = history[index];
            const rollover = item.water.rollover ? ' (Xoay vòng)' : '';
            return `Nước: ${value} m³${rollover}`;
          },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Electric Chart */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            <span className="wrap-break-word">Tiêu Thụ Điện</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-0">
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
            <Line ref={electricChartRef} data={electricChartData} options={electricChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Water Chart */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            <span className="wrap-break-word">Tiêu Thụ Nước</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-0">
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full">
            <Line ref={waterChartRef} data={waterChartData} options={waterChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
