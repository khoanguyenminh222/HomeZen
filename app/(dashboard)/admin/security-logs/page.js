'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { Shield, Clock, User, Globe, AlertTriangle, CheckCircle2, Key, Eye, Monitor, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const response = await fetch('/api/admin/security-logs');
                if (response.ok) {
                    const result = await response.json();
                    setLogs(result.data || []);
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

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
                                                    {formatDateTime(log.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {getLogTypeBadge(log.type)}
                                            </td>
                                            <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    {log.username || 'unknown'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 font-mono text-[12px] text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Globe className="h-3 w-3" />
                                                    {log.ip || '0.0.0.0'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px] sm:max-w-[300px]">
                                                {log.reason}
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
                                        {formatDateTime(selectedLog.timestamp)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Loại sự kiện</h4>
                                    <div className="flex">{getLogTypeBadge(selectedLog.type)}</div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Người dùng</h4>
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {selectedLog.username || 'unknown'} {selectedLog.userId && `(${selectedLog.userId})`}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Địa chỉ IP</h4>
                                    <p className="text-sm font-medium font-mono flex items-center gap-2 text-foreground/80">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        {selectedLog.ip || '0.0.0.0'}
                                    </p>
                                </div>
                                <div className="space-y-1 col-span-full bg-muted/30 p-3 rounded-lg border border-dashed">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Yêu cầu (Request)</h4>
                                    <div className="text-sm font-medium flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                            <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">{selectedLog.method}</span>
                                        </div>
                                        <span className="text-muted-foreground break-all">{selectedLog.endpoint}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-full">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lý do / Mô tả</h4>
                                    <p className="text-sm border-l-2 border-primary/30 pl-3 py-2 italic bg-muted/20 rounded-r leading-relaxed">
                                        {selectedLog.reason}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Dữ liệu kỹ thuật (Metadata)</h4>
                                    <div className="bg-zinc-950 p-4 rounded-xl shadow-inner w-full max-w-full">
                                        <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap break-words">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
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
