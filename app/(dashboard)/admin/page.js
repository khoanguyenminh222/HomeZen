'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Home, FileText, TrendingUp, Shield } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

/**
 * Super Admin Dashboard Page
 * Requirements: 1.1, 1.3, 8.1, 8.2
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Không thể tải thống kê hệ thống');
        }
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        console.error('Lỗi khi tải admin stats:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Đã xảy ra lỗi: {error}</p>
        <p className="text-sm mt-2 text-muted-foreground">Vui lòng tải lại trang.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng số người dùng',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Tất cả users trong hệ thống',
    },
    {
      title: 'Chủ trọ',
      value: stats?.totalPropertyOwners || 0,
      icon: Shield,
      description: `${stats?.activePropertyOwners || 0} đang hoạt động`,
    },
    {
      title: 'Nhà trọ',
      value: stats?.totalProperties || 0,
      icon: Building2,
      description: 'Tổng số nhà trọ',
    },
    {
      title: 'Phòng',
      value: stats?.totalRooms || 0,
      icon: Home,
      description: 'Tổng số phòng trong hệ thống',
    },
    {
      title: 'Người thuê',
      value: stats?.totalTenants || 0,
      icon: Users,
      description: 'Tổng số người thuê',
    },
    {
      title: 'Hóa đơn',
      value: stats?.totalBills || 0,
      icon: FileText,
      description: 'Tổng số hóa đơn',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Quản Trị</h2>
          <p className="text-muted-foreground mt-1">
            Tổng quan hệ thống quản lý nhà trọ
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString('vi-VN')}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái chủ trọ</CardTitle>
            <CardDescription>Phân bổ chủ trọ theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đang hoạt động</span>
                <span className="text-sm font-semibold text-green-600">
                  {stats?.activePropertyOwners || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đã vô hiệu hóa</span>
                <span className="text-sm font-semibold text-red-600">
                  {stats?.inactivePropertyOwners || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
            <CardDescription>Thống kê tổng quan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng chủ trọ</span>
                <span className="text-sm font-semibold">
                  {stats?.totalPropertyOwners || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng nhà trọ</span>
                <span className="text-sm font-semibold">
                  {stats?.totalProperties || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng phòng</span>
                <span className="text-sm font-semibold">
                  {stats?.totalRooms || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
