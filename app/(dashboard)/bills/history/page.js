'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatDateTime, formatDate } from '@/lib/format';
import {
  History,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  DollarSign,
  User,
  Clock,
  FileText,
  Filter,
  Search,
  Home,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const actionConfig = {
  CREATE: {
    label: 'Tạo mới',
    icon: Plus,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  UPDATE: {
    label: 'Cập nhật',
    icon: Edit,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  DELETE: {
    label: 'Xóa',
    icon: Trash2,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  STATUS_CHANGE: {
    label: 'Thay đổi trạng thái',
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  FEE_ADD: {
    label: 'Thêm phí',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  },
  FEE_REMOVE: {
    label: 'Xóa phí',
    icon: DollarSign,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  FEE_UPDATE: {
    label: 'Cập nhật phí',
    icon: DollarSign,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  },
};

/**
 * Trang xem lịch sử thay đổi tất cả hóa đơn
 */
export default function BillHistoryPage() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({
    action: 'all',
    roomId: 'all',
    month: 'all',
    year: '',
  });
  const [total, setTotal] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Get current year and month for default values
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchHistories();
  }, [filters]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchHistories = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.action && filters.action !== 'all') {
        params.append('action', filters.action);
      }
      if (filters.roomId && filters.roomId !== 'all') {
        params.append('roomId', filters.roomId);
      }
      if (filters.month && filters.month !== 'all') {
        params.append('month', filters.month);
      }
      if (filters.year && filters.year !== '') {
        params.append('year', filters.year);
      }

      const response = await fetch(`/api/bills/history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistories(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching bill histories:', err);
      setError('Không thể tải lịch sử thay đổi');
    } finally {
      setLoading(false);
    }
  };

  const getBillInfo = (history) => {
    if (history.bill) {
      return {
        exists: true,
        month: history.bill.month,
        year: history.bill.year,
        roomCode: history.bill.room?.code || 'N/A',
        roomName: history.bill.room?.name || 'N/A',
        billId: history.bill.id,
      };
    }

    // Nếu bill đã bị xóa, lấy thông tin từ oldData hoặc newData
    const billId = history.billId || history.originalBillId;

    // Ưu tiên oldData (cho DELETE action)
    if (history.oldData) {
      const oldData = typeof history.oldData === 'string'
        ? JSON.parse(history.oldData)
        : history.oldData;

      if (oldData.month || oldData.year || oldData.room) {
        return {
          exists: false,
          month: oldData.month || 'N/A',
          year: oldData.year || 'N/A',
          roomCode: oldData.room?.code || 'Đã xóa',
          roomName: oldData.room?.name || 'Đã xóa',
          billId: billId,
        };
      }
    }

    // Fallback: sử dụng newData (cho CREATE action)
    if (history.newData) {
      const newData = typeof history.newData === 'string'
        ? JSON.parse(history.newData)
        : history.newData;

      if (newData.month || newData.year || newData.room) {
        return {
          exists: false,
          month: newData.month || 'N/A',
          year: newData.year || 'N/A',
          roomCode: newData.room?.code || 'Đã xóa',
          roomName: newData.room?.name || 'Đã xóa',
          billId: billId,
        };
      }
    }

    // Fallback cuối cùng
    return {
      exists: false,
      month: 'N/A',
      year: 'N/A',
      roomCode: 'N/A',
      roomName: 'N/A',
      billId: billId || 'unknown',
    };
  };

  // 1. Group histories by bill (billId hoặc originalBillId)
  const groupedHistories = useMemo(() => {
    return histories.reduce((acc, history) => {
      const billInfo = getBillInfo(history);
      const key = history.originalBillId || billInfo.billId || 'unknown';

      if (!acc[key]) {
        acc[key] = {
          key: key,
          billId: billInfo.billId,
          billInfo: billInfo,
          histories: [],
        };
      }
      acc[key].histories.push(history);
      return acc;
    }, {});
  }, [histories]);

  // 2. Convert to array and sort
  const groupedArray = useMemo(() => {
    return Object.values(groupedHistories).map(group => ({
      ...group,
      latestDate: Math.max(...group.histories.map(h => new Date(h.createdAt).getTime())),
    })).sort((a, b) => b.latestDate - a.latestDate);
  }, [groupedHistories]);

  // 3. Stable keys for all groups
  const allKeys = useMemo(() => {
    return groupedArray.map((group, index) => group.key || `deleted-${index}`);
  }, [groupedArray]);

  // Initialize: expand first 3 groups by default when histories change
  useEffect(() => {
    if (groupedArray.length > 0) {
      const firstThree = allKeys.slice(0, 3);
      setExpandedGroups(new Set(firstThree));
    } else {
      setExpandedGroups(new Set());
    }
  }, [groupedArray, allKeys]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(allKeys));
  };

  const collapseAll = () => {
    // Thu gọn tất cả thực sự (không để lại 3 cái)
    setExpandedGroups(new Set());
  };

  const toggleAll = () => {
    // Kiểm tra trạng thái thực tế: tất cả groups có đang expanded không
    const isAllExpanded = allKeys.length > 0 && allKeys.every(key => expandedGroups.has(key));

    if (isAllExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <span className="wrap-break-word">Lịch Sử Thay Đổi Hóa Đơn</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <span className="wrap-break-word">Lịch Sử Thay Đổi Hóa Đơn</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-4 md:pb-6">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg md:text-xl">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="wrap-break-word flex-1 min-w-0">Lịch Sử Thay Đổi Hóa Đơn</span>
            <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
              {total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Filters and Controls */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger className="h-11 sm:h-11 text-sm sm:text-base touch-manipulation">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Lọc theo hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hành động</SelectItem>
                  <SelectItem value="CREATE">Tạo mới</SelectItem>
                  <SelectItem value="UPDATE">Cập nhật</SelectItem>
                  <SelectItem value="DELETE">Xóa</SelectItem>
                  <SelectItem value="STATUS_CHANGE">Thay đổi trạng thái</SelectItem>
                  <SelectItem value="FEE_ADD">Thêm phí</SelectItem>
                  <SelectItem value="FEE_REMOVE">Xóa phí</SelectItem>
                  <SelectItem value="FEE_UPDATE">Cập nhật phí</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.roomId}
                onValueChange={(value) => setFilters({ ...filters, roomId: value })}
              >
                <SelectTrigger className="h-11 sm:h-11 text-sm sm:text-base touch-manipulation">
                  <Home className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Lọc theo phòng" />
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
                <SelectTrigger className="h-11 sm:h-11 text-sm sm:text-base touch-manipulation">
                  <Calendar className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Lọc theo tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tháng</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      Tháng {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Năm (VD: 2024)"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="h-11 sm:h-11 text-sm sm:text-base touch-manipulation"
                  min="2000"
                  max="2100"
                />
                {filters.year && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ ...filters, year: '' })}
                    className="h-11 sm:h-11 px-3 min-w-touch touch-manipulation"
                    aria-label="Xóa năm"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 md:gap-4">
              {groupedArray.length > 0 && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Hiển thị {expandedGroups.size}/{groupedArray.length} hóa đơn
                </div>
              )}
              {groupedArray.length > 0 && (() => {
                const isAllExpanded = allKeys.length > 0 && allKeys.every(key => expandedGroups.has(key));

                return (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isAllExpanded ? collapseAll : expandAll}
                    className="h-11 sm:h-11 text-sm sm:text-base shrink-0 w-full sm:w-auto sm:ml-auto touch-manipulation"
                  >
                    {isAllExpanded ? (
                      <>
                        <ChevronsUpDown className="h-4 w-4 mr-2 shrink-0" />
                        <span>Thu gọn tất cả</span>
                      </>
                    ) : (
                      <>
                        <ChevronsDownUp className="h-4 w-4 mr-2 shrink-0" />
                        <span>Mở rộng tất cả</span>
                      </>
                    )}
                  </Button>
                );
              })()}
            </div>
          </div>

          {/* History List */}
          {histories.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <History className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground">Chưa có lịch sử thay đổi nào</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {groupedArray.map((group, groupIndex) => {
                const { billInfo, histories: groupHistories } = group;
                const groupKey = allKeys[groupIndex];
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <div key={groupKey} className="border border-border/50 rounded-lg overflow-hidden bg-card">
                    {/* Bill Header - Clickable to expand/collapse */}
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full bg-muted/50 hover:bg-muted/70 active:bg-muted/80 transition-colors p-3.5 sm:p-4 md:p-5 touch-manipulation"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                            <span className="font-semibold text-sm sm:text-base md:text-lg text-foreground wrap-break-word">
                              Phòng {billInfo.roomCode}
                            </span>
                            {billInfo.roomName && billInfo.roomName !== 'Đã xóa' && (
                              <span className="text-xs sm:text-sm text-muted-foreground wrap-break-word hidden sm:inline">
                                ({billInfo.roomName})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                            <span className="font-medium text-xs sm:text-sm md:text-base text-foreground whitespace-nowrap">
                              Tháng {billInfo.month}/{billInfo.year}
                            </span>
                          </div>
                          {/* Badges - cùng hàng khi đủ width */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {!billInfo.exists && (
                              <Badge variant="destructive" className="text-[10px] sm:text-xs shrink-0">
                                Hóa đơn đã xóa
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                              {groupHistories.length} thay đổi
                            </Badge>
                          </div>
                        </div>
                        {billInfo.exists && group.billId && (
                          <div className="flex items-center justify-start sm:justify-end">
                            <Link
                              href={`/bills/${group.billId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs sm:text-sm text-primary hover:underline font-medium inline-flex items-center gap-1 touch-manipulation"
                            >
                              Xem hóa đơn
                              <span className="hidden sm:inline">→</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Histories for this bill - Collapsible */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 md:p-6">
                        <div className="space-y-4 sm:space-y-6">
                          {groupHistories.map((history, index) => {
                            const config = actionConfig[history.action] || {
                              label: history.action,
                              icon: FileText,
                              color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                            };
                            const Icon = config.icon;
                            const billInfo = getBillInfo(history);

                            return (
                              <div
                                key={history.id}
                                className={cn(
                                  'relative pl-6 sm:pl-8 pb-6 sm:pb-8',
                                  'border-l-2 transition-colors',
                                  index !== groupHistories.length - 1 
                                    ? 'border-border/50' 
                                    : 'border-transparent'
                                )}
                              >
                                {/* Timeline dot */}
                                <div className="absolute left-0 top-1.5 sm:top-2">
                                  <div className={cn(
                                    'w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-background shadow-sm',
                                    'flex items-center justify-center',
                                    config.color.includes('green') && 'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-500',
                                    config.color.includes('blue') && 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-500',
                                    config.color.includes('red') && 'bg-red-500 border-red-600 dark:bg-red-600 dark:border-red-500',
                                    config.color.includes('purple') && 'bg-purple-500 border-purple-600 dark:bg-purple-600 dark:border-purple-500',
                                    config.color.includes('emerald') && 'bg-emerald-500 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500',
                                    config.color.includes('orange') && 'bg-orange-500 border-orange-600 dark:bg-orange-600 dark:border-orange-500',
                                    config.color.includes('cyan') && 'bg-cyan-500 border-cyan-600 dark:bg-cyan-600 dark:border-cyan-500',
                                    !config.color.includes('green') && !config.color.includes('blue') && !config.color.includes('red') && 
                                    !config.color.includes('purple') && !config.color.includes('emerald') && !config.color.includes('orange') && 
                                    !config.color.includes('cyan') && 'bg-gray-500 border-gray-600 dark:bg-gray-600 dark:border-gray-500'
                                  )}>
                                    <Icon className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-3 sm:space-y-4">
                                  {/* Header */}
                                  <div className="flex flex-col gap-2 sm:gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                                      <div className="flex items-start gap-2 sm:gap-3 flex-wrap">
                                        <Badge 
                                          variant="outline" 
                                          className={cn(
                                            'text-xs sm:text-sm font-medium px-2 sm:px-3 py-1',
                                            'border-2 shrink-0',
                                            config.color
                                          )}
                                        >
                                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                                          {config.label}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground shrink-0 bg-muted/50 px-2 sm:px-3 py-1 rounded-md">
                                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                          <span className="whitespace-nowrap">{formatDateTime(history.createdAt)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    {history.description && (
                                      <div className="text-xs sm:text-sm text-muted-foreground wrap-break-word leading-relaxed">
                                        {history.description}
                                      </div>
                                    )}
                                  </div>

                                  {/* User info */}
                                  {history.user && (
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 sm:px-3 py-1.5 rounded-md w-fit max-w-full">
                                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                      <span className="font-medium shrink-0">Bởi:</span>
                                      <span className="text-foreground wrap-break-word">{history.user.username}</span>
                                    </div>
                                  )}

                                  {/* Changes detail */}
                                  {history.changes && history.changes.fields && (
                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-muted/30 dark:bg-muted/20 rounded-lg sm:rounded-xl border border-border/50 space-y-2 sm:space-y-3">
                                      <div className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">
                                        Chi tiết thay đổi:
                                      </div>
                                      {Object.entries(history.changes.fields).map(([field, change]) => (
                                        <div 
                                          key={field} 
                                          className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-2 sm:p-3 bg-background/50 rounded-md hover:bg-background/80 transition-colors"
                                        >
                                          <span className="font-semibold text-xs sm:text-sm text-foreground min-w-[120px] sm:min-w-[140px] shrink-0">
                                            {getFieldLabel(field)}:
                                          </span>
                                          <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                                            {change.old !== undefined && change.old !== null && (
                                              <div className="flex items-start gap-2 text-xs sm:text-sm">
                                                <span className="font-medium text-red-600 dark:text-red-400 shrink-0">Cũ:</span>
                                                <span className="text-red-600 dark:text-red-400 wrap-break-word">{formatFieldValue(field, change.old)}</span>
                                              </div>
                                            )}
                                            {change.new !== undefined && change.new !== null && (
                                              <div className="flex items-start gap-2 text-xs sm:text-sm">
                                                <span className="font-medium text-green-600 dark:text-green-400 shrink-0">Mới:</span>
                                                <span className="text-green-600 dark:text-green-400 wrap-break-word">{formatFieldValue(field, change.new)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Lấy label cho field
 */
function getFieldLabel(field) {
  const labels = {
    month: 'Tháng',
    year: 'Năm',
    oldElectricReading: 'Chỉ số điện cũ',
    newElectricReading: 'Chỉ số điện mới',
    electricityUsage: 'Lượng điện tiêu thụ',
    oldWaterReading: 'Chỉ số nước cũ',
    newWaterReading: 'Chỉ số nước mới',
    waterUsage: 'Lượng nước tiêu thụ',
    roomPrice: 'Giá phòng',
    electricityCost: 'Tiền điện',
    waterCost: 'Tiền nước',
    totalCost: 'Tổng tiền',
    isPaid: 'Trạng thái thanh toán',
    paidAmount: 'Số tiền đã thanh toán',
    paidDate: 'Ngày thanh toán',
    notes: 'Ghi chú',
    billFees: 'Phí phát sinh',
  };
  return labels[field] || field;
}

/**
 * Format giá trị field để hiển thị
 */
function formatFieldValue(field, value) {
  if (value === null || value === undefined) return 'N/A';
  
  if (Array.isArray(value)) {
    return value.length > 0 
      ? value.map(v => `${v.name || v.id}: ${v.amount ? Number(v.amount).toLocaleString('vi-VN') + ' VNĐ' : ''}`).join(', ')
      : 'Không có';
  }

  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không';
  }

  if (field.includes('Cost') || field.includes('Price') || field.includes('Amount')) {
    return Number(value).toLocaleString('vi-VN') + ' VNĐ';
  }

  if (field === 'isPaid') {
    return value ? 'Đã thanh toán' : 'Chưa thanh toán';
  }

  if (field === 'paidDate' || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
    return formatDate(value);
  }

  return String(value);
}
