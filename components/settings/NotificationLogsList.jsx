'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Mail, Send, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

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

// Notification Log Item Component
function NotificationLogItem({ log, getStatusBadge, getTypeIcon }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TypeIcon = getTypeIcon(log.type);
  const messageLines = log.message?.split('\n') || [];
  const shouldTruncate = messageLines.length > 3 || log.message?.length > 200;
  const displayMessage = shouldTruncate && !isExpanded 
    ? messageLines.slice(0, 3).join('\n') + (messageLines.length > 3 ? '...' : '')
    : log.message;

  return (
    <div className="border rounded-lg p-4 sm:p-5 hover:bg-muted/50 transition-colors">
      <div className="space-y-3 sm:space-y-3">
        {/* Header: Type, Status, Retry */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm sm:text-base">
              {log.type === 'EMAIL' ? 'Email' : 'Telegram'}
            </span>
          </div>
          {getStatusBadge(log.status)}
          {log.retryCount > 0 && (
            <Badge variant="outline" className="text-xs">
              Thử lại: {log.retryCount}
            </Badge>
          )}
        </div>

        {/* Subject */}
        {log.subject && (
          <p className="font-semibold text-sm sm:text-base wrap-break-word line-clamp-2">
            {log.subject}
          </p>
        )}

        {/* Message */}
        <div className="space-y-2">
          <p className="text-sm sm:text-base text-muted-foreground wrap-break-word whitespace-pre-wrap">
            {displayMessage}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 text-xs text-primary hover:text-primary/80 -ml-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Xem thêm
                </>
              )}
            </Button>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-medium">Đến:</span>
            <span className="break-all">{log.recipient}</span>
          </div>
          {log.sentAt && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-medium">Gửi lúc:</span>
              <span className="whitespace-nowrap">{formatDate(log.sentAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-medium">Tạo lúc:</span>
            <span className="whitespace-nowrap">{formatDate(log.createdAt)}</span>
          </div>
        </div>

        {/* Error Message */}
        {log.errorMessage && (
          <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 wrap-break-word">
            <span className="font-semibold">Lỗi: </span>
            <span>{log.errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
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
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Lịch Sử Thông Báo</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
            Xem lịch sử các thông báo đã được gửi qua email và telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Loại thông báo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="TELEGRAM">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 sm:h-10">
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
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <p className="text-sm sm:text-base">Chưa có lịch sử thông báo</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {logs.map((log) => (
                <NotificationLogItem
                  key={log.id}
                  log={log}
                  getStatusBadge={getStatusBadge}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
