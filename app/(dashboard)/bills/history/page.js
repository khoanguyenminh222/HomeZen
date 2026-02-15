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
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const actionConfig = {
  TAO_MOI: {
    label: 'Tạo mới',
    icon: Plus,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  CAP_NHAT: {
    label: 'Cập nhật',
    icon: Edit,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  XOA: {
    label: 'Xóa',
    icon: Trash2,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  THAY_DOI_TRANG_THAI: {
    label: 'Thay đổi trạng thái',
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  THEM_PHI: {
    label: 'Thêm phí',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  },
  XOA_PHI: {
    label: 'Xóa phí',
    icon: DollarSign,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  CAP_NHAT_PHI: {
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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [total, setTotal] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    setPage(1); // Reset to first page on filter change
  }, [filters]);

  useEffect(() => {
    fetchHistories();
  }, [filters, page, limit]);

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
      params.append('page', page);
      params.append('limit', limit);
      params.append('skip', (page - 1) * limit);

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

      if (data.pagination) {
        setPagination(data.pagination);
        setTotal(data.pagination.total);
      } else {
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching bill histories:', err);
      setError('Không thể tải lịch sử thay đổi');
    } finally {
      setLoading(false);
    }
  };

  const getBillInfo = (history) => {
    if (history.hoa_don) {
      return {
        exists: true,
        month: history.hoa_don.thang,
        year: history.hoa_don.nam,
        roomCode: history.hoa_don.phong?.ma_phong || 'N/A',
        roomName: history.hoa_don.phong?.ten_phong || 'N/A',
        billId: history.hoa_don.id,
      };
    }

    const billId = history.hoa_don_id || history.hoa_don_goc_id;

    if (history.du_lieu_cu) {
      const oldData = typeof history.du_lieu_cu === 'string'
        ? JSON.parse(history.du_lieu_cu)
        : history.du_lieu_cu;

      if (oldData.thang || oldData.nam || oldData.phong) {
        return {
          exists: false,
          month: oldData.thang || 'N/A',
          year: oldData.nam || 'N/A',
          roomCode: oldData.phong?.ma_phong || 'Đã xóa',
          roomName: oldData.phong?.ten_phong || 'Đã xóa',
          billId: billId,
        };
      }
    }

    if (history.du_lieu_moi) {
      const newData = typeof history.du_lieu_moi === 'string'
        ? JSON.parse(history.du_lieu_moi)
        : history.du_lieu_moi;

      if (newData.thang || newData.nam || newData.phong) {
        return {
          exists: false,
          month: newData.thang || 'N/A',
          year: newData.nam || 'N/A',
          roomCode: newData.phong?.ma_phong || 'Đã xóa',
          roomName: newData.phong?.ten_phong || 'Đã xóa',
          billId: billId,
        };
      }
    }

    return {
      exists: false,
      month: 'N/A',
      year: 'N/A',
      roomCode: 'N/A',
      roomName: 'N/A',
      billId: billId || 'unknown',
    };
  };

  const groupedHistories = useMemo(() => {
    const groups = histories.reduce((acc, history) => {
      const billInfo = getBillInfo(history);
      const key = history.hoa_don_goc_id || billInfo.billId || 'unknown';

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

    return Object.values(groups).map(group => ({
      ...group,
      latestDate: Math.max(...group.histories.map(h => new Date(h.ngay_tao).getTime())),
    })).sort((a, b) => b.latestDate - a.latestDate);
  }, [histories]);

  const allKeys = useMemo(() => {
    return groupedHistories.map((group, index) => group.key || `deleted-${index}`);
  }, [groupedHistories]);

  useEffect(() => {
    if (groupedHistories.length > 0) {
      const firstThree = allKeys.slice(0, 3);
      setExpandedGroups(new Set(firstThree));
    } else {
      setExpandedGroups(new Set());
    }
  }, [groupedHistories, allKeys]);

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

  const expandAll = () => setExpandedGroups(new Set(allKeys));
  const collapseAll = () => setExpandedGroups(new Set());

  if (loading && histories.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Lịch Sử Thay Đổi Hóa Đơn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-5 w-5 text-primary" />
            </div>
            <span className="flex-1">Lịch Sử Thay Đổi Hóa Đơn</span>
            <Badge variant="secondary">{total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filters.action} onValueChange={(val) => setFilters(f => ({ ...f, action: val }))}>
              <SelectTrigger><SelectValue placeholder="Hành động" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="TAO_MOI">Tạo mới</SelectItem>
                <SelectItem value="CAP_NHAT">Cập nhật</SelectItem>
                <SelectItem value="XOA">Xóa</SelectItem>
                <SelectItem value="THAY_DOI_TRANG_THAI">Thay đổi trạng thái</SelectItem>
                <SelectItem value="THEM_PHI">Thêm phí</SelectItem>
                <SelectItem value="XOA_PHI">Xóa phí</SelectItem>
                <SelectItem value="CAP_NHAT_PHI">Cập nhật phí</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.roomId} onValueChange={(val) => setFilters(f => ({ ...f, roomId: val }))}>
              <SelectTrigger><SelectValue placeholder="Phòng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng</SelectItem>
                {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.ma_phong}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.month} onValueChange={(val) => setFilters(f => ({ ...f, month: val }))}>
              <SelectTrigger><SelectValue placeholder="Tháng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tháng</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Năm"
              value={filters.year}
              onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Hiển thị {groupedHistories.length} hóa đơn trong trang này
            </div>
            <Button variant="outline" size="sm" onClick={() => (expandedGroups.size === allKeys.length ? collapseAll() : expandAll())}>
              {expandedGroups.size === allKeys.length ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
            </Button>
          </div>

          {/* History List */}
          {histories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic">
              Không tìm thấy thay đổi nào.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedHistories.map((group, idx) => {
                const groupKey = allKeys[idx];
                const isExpanded = expandedGroups.has(groupKey);
                return (
                  <div key={groupKey} className="border rounded-lg overflow-hidden bg-card">
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <div className="text-left">
                          <div className="font-semibold">
                            Phòng {group.billInfo.roomCode} - Tháng {group.billInfo.month}/{group.billInfo.year}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.histories.length} thay đổi • Lần cuối: {formatDateTime(group.latestDate)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!group.billInfo.exists && <Badge variant="destructive">Đã xóa</Badge>}
                        {group.billInfo.exists && (
                          <Link
                            href={`/bills/${group.billId}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Chi tiết →
                          </Link>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="divide-y border-t bg-background/50">
                        {group.histories.map(history => (
                          <div key={history.id} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={actionConfig[history.hanh_dong]?.color}>
                                  {actionConfig[history.hanh_dong]?.label || history.hanh_dong}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {formatDateTime(history.ngay_tao)}
                                </span>
                              </div>
                              <span className="text-xs font-medium flex items-center gap-1">
                                <User className="h-3 w-3" /> {history.nguoi_dung?.tai_khoan || 'unknown'}
                              </span>
                            </div>

                            {history.thay_doi?.fields && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                {Object.entries(history.thay_doi.fields).map(([field, change]) => (
                                  <div key={field} className="text-xs p-2 bg-muted/20 rounded border border-border/50">
                                    <div className="font-semibold mb-1">{getFieldLabel(field)}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="text-red-500 line-through truncate">{formatFieldValue(field, change.old)}</div>
                                      <div className="text-green-600 font-medium truncate">→ {formatFieldValue(field, change.new)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {history.mo_ta && (
                              <p className="text-xs text-muted-foreground bg-muted/10 p-2 rounded italic">
                                {history.mo_ta}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-dashed">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Hiển thị {histories.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} trong tổng số {total} thay đổi
            </div>

            <div className="flex items-center gap-6 order-1 sm:order-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium whitespace-nowrap">Số dòng:</p>
                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={limit} /></SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Trang {page} / {pagination.totalPages || 1}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages || pagination.totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" className="h-8 w-8 p-0" onClick={() => setPage(pagination.totalPages)} disabled={page === pagination.totalPages || pagination.totalPages === 0}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getFieldLabel(field) {
  const labels = {
    thang: 'Tháng', nam: 'Năm', chi_so_dien_cu: 'Số điện cũ', chi_so_dien_moi: 'Số điện mới',
    tieu_thu_dien: 'Điện tiêu thụ', chi_so_nuoc_cu: 'Số nước cũ', chi_so_nuoc_moi: 'Số nước mới',
    tieu_thu_nuoc: 'Nước tiêu thụ', gia_phong: 'Giá phòng', tien_dien: 'Tiền điện',
    tien_nuoc: 'Tiền nước', tong_tien: 'Tổng tiền', da_thanh_toan: 'Thanh toán',
    so_tien_da_tra: 'Tiền đã trả', ngay_thanh_toan: 'Ngày trả', ghi_chu: 'Ghi chú'
  };
  return labels[field] || field;
}

function formatFieldValue(field, value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Đã xong' : 'Chưa xong';
  if (field.includes('tien') || field.includes('gia') || field.includes('so_tien')) {
    return Number(value).toLocaleString('vi-VN') + ' đ';
  }
  return String(value);
}
