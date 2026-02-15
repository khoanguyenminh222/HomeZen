'use client';

import { useEffect, useState } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RoomStatusChart from '@/components/dashboard/RoomStatusChart';
import RevenueChart from '@/components/dashboard/RevenueChart';
import UnpaidBillsList from '@/components/dashboard/UnpaidBillsList';
import MeterReadingReminders from '@/components/dashboard/MeterReadingReminders';
import DebtWarningList from '@/components/dashboard/DebtWarningList';
import { Card, CardContent } from '@/components/ui/card';

import { UserContextSelector } from '@/components/dashboard/UserContextSelector';
import { useSession } from 'next-auth/react';

/**
 * Trang Dashboard (Tổng Quan)
 * Requirements: 13.1-13.11
 */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);

  const isSuperAdmin = session?.user?.vai_tro === 'SIEU_QUAN_TRI';

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const url = targetUserId
          ? `/api/dashboard/stats?userId=${targetUserId}`
          : '/api/dashboard/stats';

        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            // Session expired, redirect to login
            window.location.href = '/login?error=Session expired';
            return;
          }
          throw new Error('Không thể tải thống kê');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Lỗi khi tải dashboard stats:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [targetUserId]);

  if (isLoading && !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Đã xảy ra lỗi: {error}</p>
        <p className="text-sm mt-2 text-muted-foreground">Vui lòng tải lại trang.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-primary hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tổng Quan</h2>
          <p className="text-muted-foreground">
            Tháng {stats?.currentMonth}/{stats?.currentYear}
          </p>
        </div>

        {isSuperAdmin && (
          <UserContextSelector
            currentUserId={targetUserId}
            onUserChange={setTargetUserId}
          />
        )}
      </div>

      {/* Thống kê tổng quan */}
      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Cột chính (Rộng hơn) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Biểu đồ doanh thu */}
          <RevenueChart userId={targetUserId} />

          {/* Chỉ hiển thị danh sách chi tiết cho Property Owner */}
          {!isSuperAdmin && <UnpaidBillsList />}
        </div>

        {/* Cột phụ (Bên phải) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Biểu đồ trạng thái phòng */}
          <RoomStatusChart stats={stats} />

          {/* Chỉ hiển thị nhắc nhở cho Property Owner */}
          {!isSuperAdmin && (
            <>
              <MeterReadingReminders />
              <DebtWarningList />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
