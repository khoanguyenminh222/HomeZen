'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import MeterHistoryTable from '@/components/meter-history/MeterHistoryTable';
import MeterHistoryChart from '@/components/meter-history/MeterHistoryChart';
import { Home, Calendar, Filter } from 'lucide-react';

/**
 * Trang lịch sử chỉ số điện nước
 * Requirements: 17.1-17.13
 */
export default function MeterHistoryPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [history, setHistory] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  // Date filters
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Default: 6 tháng gần nhất
  const [filters, setFilters] = useState({
    startMonth: currentMonth >= 6 ? currentMonth - 5 : currentMonth + 7,
    startYear: currentMonth >= 6 ? currentYear : currentYear - 1,
    endMonth: currentMonth,
    endYear: currentYear,
  });

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách phòng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch meter history
  const fetchMeterHistory = async () => {
    if (!selectedRoomId) {
      setHistory([]);
      setRoomInfo(null);
      return;
    }

    try {
      setLoadingHistory(true);
      const params = new URLSearchParams();
      if (filters.startMonth) params.append('startMonth', filters.startMonth);
      if (filters.startYear) params.append('startYear', filters.startYear);
      if (filters.endMonth) params.append('endMonth', filters.endMonth);
      if (filters.endYear) params.append('endYear', filters.endYear);

      const response = await fetch(`/api/rooms/${selectedRoomId}/meter-history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch meter history');
      const data = await response.json();
      setHistory(data.history || []);
      setRoomInfo(data.room || null);
    } catch (error) {
      console.error('Error fetching meter history:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử chỉ số',
        variant: 'destructive',
      });
      setHistory([]);
      setRoomInfo(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchMeterHistory();
  }, [selectedRoomId, filters]);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span className="wrap-break-word">Lịch Sử Chỉ Số Điện Nước</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Theo dõi lịch sử chỉ số đồng hồ điện nước theo thời gian
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Bộ Lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {/* Room Selection */}
            <div className="space-y-2 sm:col-span-1 lg:col-span-1 xl:col-span-1">
              <label className="text-sm sm:text-base font-medium flex items-center gap-2">
                <Home className="h-4 w-4 shrink-0" />
                <span>Phòng</span>
              </label>
              <Select
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
                disabled={loading}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id} className="text-sm sm:text-base">
                      {room.code} - {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Month */}
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-medium">Từ Tháng</label>
              <Select
                value={filters.startMonth?.toString() || ''}
                onValueChange={(value) =>
                  setFilters({ ...filters, startMonth: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month.toString()} className="text-sm sm:text-base">
                      {monthNames[month - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Year */}
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-medium">Từ Năm</label>
              <Select
                value={filters.startYear?.toString() || ''}
                onValueChange={(value) =>
                  setFilters({ ...filters, startYear: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-sm sm:text-base">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Month */}
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-medium">Đến Tháng</label>
              <Select
                value={filters.endMonth?.toString() || ''}
                onValueChange={(value) =>
                  setFilters({ ...filters, endMonth: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month.toString()} className="text-sm sm:text-base">
                      {monthNames[month - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Year */}
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-medium">Đến Năm</label>
              <Select
                value={filters.endYear?.toString() || ''}
                onValueChange={(value) =>
                  setFilters({ ...filters, endYear: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-sm sm:text-base">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingHistory && (
        <div className="flex justify-center py-8 sm:py-12">
          <Loading />
        </div>
      )}

      {/* Content */}
      {!loadingHistory && selectedRoomId && (
        <div className="space-y-4 sm:space-y-6">
          {roomInfo && (
            <Card>
              <CardContent className="py-3 sm:py-4 px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Home className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="font-semibold text-sm sm:text-base wrap-break-word">
                    {roomInfo.code} - {roomInfo.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Chart */}
            <div className="w-full">
              <MeterHistoryChart history={history} />
            </div>

            {/* Table */}
            <div className="w-full">
              <MeterHistoryTable history={history} />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loadingHistory && !selectedRoomId && (
        <Card>
          <CardContent className="py-8 sm:py-12 px-4 sm:px-6">
            <div className="text-center">
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                Vui lòng chọn phòng để xem lịch sử chỉ số
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
