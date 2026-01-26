'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { Shield, Clock, User, Globe, AlertTriangle, CheckCircle2, Key } from 'lucide-react';

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

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
                                        <th className="px-4 py-3 text-left font-medium">Chi tiết</th>
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
                                            <td className="px-4 py-3 text-muted-foreground max-w-[200px] sm:max-w-none break-words">
                                                {log.reason}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
