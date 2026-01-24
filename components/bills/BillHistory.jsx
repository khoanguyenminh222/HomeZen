'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/format';
import { 
  History, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  DollarSign,
  User,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

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
 * Component hiển thị lịch sử thay đổi hóa đơn
 */
export default function BillHistory({ billId }) {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (billId) {
      fetchHistory();
    }
  }, [billId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/bills/${billId}/history`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch history`);
      }
      const data = await response.json();
      setHistories(data.data || []);
    } catch (err) {
      console.error('Error fetching bill history:', err);
      setError(err.message || 'Không thể tải lịch sử thay đổi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="wrap-break-word">Lịch Sử Thay Đổi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="py-8 sm:py-12">
            <Loading />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="wrap-break-word">Lịch Sử Thay Đổi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 sm:py-12">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit mx-auto mb-4">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm sm:text-base text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Vui lòng thử lại sau</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (histories.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="wrap-break-word">Lịch Sử Thay Đổi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 sm:py-12">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-4">
              <History className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">Chưa có lịch sử thay đổi nào</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Mọi thay đổi sẽ được ghi lại tại đây</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <span className="wrap-break-word">Lịch Sử Thay Đổi</span>
          <Badge variant="secondary" className="ml-auto text-xs sm:text-sm">
            {histories.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 sm:space-y-6">
          {histories.map((history, index) => {
            const config = actionConfig[history.action] || {
              label: history.action,
              icon: FileText,
              color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
            };
            const Icon = config.icon;

            return (
              <div
                key={history.id}
                className={cn(
                  'relative pl-6 sm:pl-8 pb-6 sm:pb-8',
                  'border-l-2 transition-colors',
                  index !== histories.length - 1 
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
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
                      {history.description && (
                        <span className="text-xs sm:text-sm text-muted-foreground truncate flex-1">
                          {history.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground shrink-0 bg-muted/50 px-2 sm:px-3 py-1 rounded-md">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="whitespace-nowrap">{formatDateTime(history.createdAt)}</span>
                    </div>
                  </div>

                  {/* User info */}
                  {history.user && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 sm:px-3 py-1.5 rounded-md w-fit">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span className="font-medium">Bởi:</span>
                      <span className="text-foreground">{history.user.username}</span>
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
      </CardContent>
    </Card>
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
