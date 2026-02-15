'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { Shield, Clock, User, Globe, AlertTriangle, CheckCircle2, Key, Eye, Monitor, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
    });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/security-logs?page=${page}&limit=${limit}`);
            if (response.ok) {
                const result = await response.json();
                setLogs(result.data || []);
                if (result.pagination) {
                    setPagination(result.pagination);
                }
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, limit]);

    const getLogTypeBadge = (type) => {
        switch (type) {
            case 'MASTER_PASS_USE':
                return <Badge variant="destructive" className="flex items-center gap-1"><Key className="h-3 w-3" /> Siêu Mật Khẩu</Badge>;
            case 'LOGIN_SUCCESS':
                return <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Đăng nhập OK</Badge>;
            case 'LOGIN_FAILURE':
                return <Badge variant="outline" className="text-red-500 border-red-200 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Đăng nhập lỗi</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Lịch Sử Hệ Thống</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Nhật ký bảo mật và đăng nhập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic">
                            Chưa có dữ liệu nhật ký.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm min-w-[700px] md:min-w-full">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="px-4 py-3 text-left font-medium">Thời gian</th>
                                            <th className="px-4 py-3 text-left font-medium">Sự kiện</th>
                                            <th className="px-4 py-3 text-left font-medium">Người dùng</th>
                                            <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Địa chỉ IP</th>
                                            <th className="px-4 py-3 text-left font-medium">Lý do</th>
                                            <th className="px-4 py-3 text-center font-medium">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                                                    <div className="flex items-center gap-1.5 text-[12px]">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDateTime(log.thoi_gian)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getLogTypeBadge(log.loai)}
                                                </td>
                                                <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                        {log.tai_khoan || 'unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Globe className="h-3 w-3" />
                                                        {log.dia_chi_ip || '0.0.0.0'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px] sm:max-w-[300px]">
                                                    {log.ly_do}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:text-primary hover:bg-primary/5"
                                                        onClick={() => setSelectedLog(log)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                    Hiển thị {logs.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, pagination.total)} trong tổng số {pagination.total} nhật ký
                                </div>

                                <div className="flex items-center gap-6 order-1 sm:order-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium whitespace-nowrap">Số dòng:</p>
                                        <Select
                                            value={String(limit)}
                                            onValueChange={(value) => {
                                                setLimit(Number(value));
                                                setPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-[70px]">
                                                <SelectValue placeholder={limit} />
                                            </SelectTrigger>
                                            <SelectContent side="top">
                                                {[10, 20, 50, 100].map((pageSize) => (
                                                    <SelectItem key={pageSize} value={String(pageSize)}>
                                                        {pageSize}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                            Trang {page} / {pagination.totalPages || 1}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                className="hidden h-8 w-8 p-0 lg:flex"
                                                onClick={() => setPage(1)}
                                                disabled={page === 1}
                                            >
                                                <span className="sr-only">Go to first page</span>
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-8 w-8 p-0"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                <span className="sr-only">Go to previous page</span>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-8 w-8 p-0"
                                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                disabled={page === pagination.totalPages || pagination.totalPages === 0}
                                            >
                                                <span className="sr-only">Go to next page</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="hidden h-8 w-8 p-0 lg:flex"
                                                onClick={() => setPage(pagination.totalPages)}
                                                disabled={page === pagination.totalPages || pagination.totalPages === 0}
                                            >
                                                <span className="sr-only">Go to last page</span>
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Log Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="bg-background pb-4 border-b mb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Chi Tiết Nhật Ký Bảo Mật
                        </DialogTitle>
                        <DialogDescription>
                            Thông tin đầy đủ về sự kiện hệ thống
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Thời gian</h4>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {formatDateTime(selectedLog.thoi_gian)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Loại sự kiện</h4>
                                    <div className="flex">{getLogTypeBadge(selectedLog.loai)}</div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Người dùng</h4>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {selectedLog.tai_khoan || 'unknown'} {selectedLog.nguoi_dung_id && `(${selectedLog.nguoi_dung_id})`}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Địa chỉ IP</h4>
                                    <p className="text-sm font-medium font-mono flex items-center gap-2 text-foreground/80">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        {selectedLog.dia_chi_ip || '0.0.0.0'}
                                    </p>
                                </div>
                                <div className="space-y-1 col-span-full bg-muted/30 p-3 rounded-lg border border-dashed">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Yêu cầu (Request)</h4>
                                    <div className="text-sm font-medium flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">{selectedLog.phuong_thuc}</span>
                                        </div>
                                        <span className="text-muted-foreground break-all">{selectedLog.endpoint}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-full">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lý do / Mô tả</h4>
                                    <p className="text-sm border-l-2 border-primary/30 pl-3 py-2 italic bg-muted/20 rounded-r leading-relaxed">
                                        {selectedLog.ly_do}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.thong_tin_bo_sung && Object.keys(selectedLog.thong_tin_bo_sung).length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Dữ liệu kỹ thuật (Thông tin bổ sung)</h4>
                                    <div className="bg-zinc-950 p-4 rounded-xl shadow-inner w-full max-w-full">
                                        <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap break-words">
                                            {JSON.stringify(selectedLog.thong_tin_bo_sung, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
