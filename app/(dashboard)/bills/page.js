'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Filter } from 'lucide-react';
import BillList from '@/components/bills/BillList';
import BillForm from '@/components/bills/BillForm';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

/**
 * Trang quản lý hóa đơn
 * Requirements: 6.1, 7.1-7.4
 */
export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [filters, setFilters] = useState({
    roomId: 'all',
    month: currentMonth.toString(),
    year: currentYear.toString(),
    isPaid: 'all',
  });
  const { toast } = useToast();

  // Fetch bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.roomId && filters.roomId !== 'all') params.append('roomId', filters.roomId);
      if (filters.month && filters.month !== 'all') params.append('month', filters.month);
      if (filters.year && filters.year !== 'all') params.append('year', filters.year);
      if (filters.isPaid && filters.isPaid !== 'all') params.append('isPaid', filters.isPaid);

      const response = await fetch(`/api/bills?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      const data = await response.json();
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách hóa đơn',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchRooms();
  }, [filters]);

  const handleCreateClick = () => {
    setSelectedBill(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (bill) => {
    setSelectedBill(bill);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchBills();
  };

  const handleBillClick = (bill) => {
    window.location.href = `/bills/${bill.id}`;
  };

  // Tính tổng tiền chưa thanh toán
  const unpaidTotal = bills
    .filter(bill => !bill.isPaid)
    .reduce((sum, bill) => sum + Number(bill.totalCost || 0), 0);

  // Tính tổng tiền đã thanh toán
  const paidTotal = bills
    .filter(bill => bill.isPaid)
    .reduce((sum, bill) => sum + Number(bill.totalCost || 0), 0);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Quản Lý Hóa Đơn</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và theo dõi hóa đơn tiền phòng, bao gồm tạo mới, cập nhật và đánh dấu thanh toán.
          </p>
        </div>
        <Button onClick={handleCreateClick} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Tạo Hóa Đơn Mới
        </Button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng Hóa Đơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bills.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chưa Thanh Toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(unpaidTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bills.filter(b => !b.isPaid).length} hóa đơn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã Thanh Toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paidTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bills.filter(b => b.isPaid).length} hóa đơn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Lọc Hóa Đơn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Select
              value={filters.roomId}
              onValueChange={(value) => setFilters({ ...filters, roomId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.code} - {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.month}
              onValueChange={(value) => setFilters({ ...filters, month: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tháng</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    Tháng {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.year}
              onValueChange={(value) => setFilters({ ...filters, year: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.isPaid}
              onValueChange={(value) => setFilters({ ...filters, isPaid: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="false">Chưa thanh toán</SelectItem>
                <SelectItem value="true">Đã thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách hóa đơn */}
      {loading ? (
        <Loading />
      ) : (
        <BillList bills={bills} onBillClick={handleBillClick} />
      )}

      {/* Form Dialog */}
      <BillForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
