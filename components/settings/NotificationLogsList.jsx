'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Notification Logs List
 * Hiển thị lịch sử thông báo
 * Requirements: 7.2
 */
export default function NotificationLogsList() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [typeFilter, statusFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/notifications/logs?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      SENT: { variant: 'default', icon: CheckCircle2, label: 'Đã gửi' },
      FAILED: { variant: 'destructive', icon: XCircle, label: 'Thất bại' },
      PENDING: { variant: 'secondary', icon: Clock, label: 'Chờ xử lý' },
      RETRY: { variant: 'outline', icon: Clock, label: 'Đang thử lại' },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    return type === 'EMAIL' ? Mail : Send;
  };

  if (isLoading) {
    return <Loading text="Đang tải lịch sử thông báo..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Lịch Sử Thông Báo</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Xem lịch sử các thông báo đã được gửi qua email và telegram
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Loại thông báo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="TELEGRAM">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="SENT">Đã gửi</SelectItem>
                  <SelectItem value="FAILED">Thất bại</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="RETRY">Đang thử lại</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logs List */}
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có lịch sử thông báo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const TypeIcon = getTypeIcon(log.type);
                return (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {log.type === 'EMAIL' ? 'Email' : 'Telegram'}
                          </span>
                          {getStatusBadge(log.status)}
                          {log.retryCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Thử lại: {log.retryCount}
                            </Badge>
                          )}
                        </div>
                        {log.subject && (
                          <p className="font-semibold text-sm">{log.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Đến: {log.recipient}</span>
                          {log.sentAt && (
                            <span>
                              Gửi lúc: {formatDate(log.sentAt)}
                            </span>
                          )}
                          <span>
                            Tạo lúc: {formatDate(log.createdAt)}
                          </span>
                        </div>
                        {log.errorMessage && (
                          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            Lỗi: {log.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
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
