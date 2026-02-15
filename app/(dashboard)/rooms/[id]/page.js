'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

/**
 * Trang chi tiết phòng với thông tin nợ
 * Requirements: 18.2, 18.3, 18.5
 */
export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [room, setRoom] = useState(null);
  const [debtInfo, setDebtInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchRoomData();
    }
  }, [params.id]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);

      // Fetch room info
      const roomResponse = await fetch(`/api/rooms/${params.id}`);
      if (!roomResponse.ok) throw new Error('Failed to fetch room');
      const roomData = await roomResponse.json();
      setRoom(roomData);

      // Fetch debt info
      const debtResponse = await fetch(`/api/rooms/${params.id}/debt`);
      if (!debtResponse.ok) throw new Error('Failed to fetch debt info');
      const debtData = await debtResponse.json();
      setDebtInfo(debtData);
    } catch (error) {
      console.error('Error fetching room data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin phòng',
        variant: 'destructive',
      });
      router.push('/rooms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!room) {
    return (
      <div className="container mx-auto p-4">
        <p>Không tìm thấy phòng</p>
      </div>
    );
  }

  const statusColors = {
    TRONG: 'bg-gray-500 text-white',
    DA_THUE: 'bg-emerald-500 text-white',
  };

  const statusText = {
    TRONG: 'Phòng trống',
    DA_THUE: 'Đã thuê',
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/rooms')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{room.ma_phong}</h1>
            <p className="text-lg text-muted-foreground mt-1">{room.ten_phong}</p>
          </div>
          <Badge className={`${statusColors[room.trang_thai]} text-sm px-3 py-1 hover:bg-${statusColors[room.trang_thai]}/10 hover:text-${statusColors[room.trang_thai]}`}>
            {statusText[room.trang_thai]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Phòng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mã phòng</p>
                  <p className="font-medium text-lg">{room.ma_phong}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tên phòng</p>
                  <p className="font-medium">{room.ten_phong}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá phòng</p>
                  <p className="font-medium text-lg text-primary">
                    {formatCurrency(room.gia_phong)}
                  </p>
                </div>
                {room.ngay_chot_so && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày chốt số</p>
                    <p className="font-medium">
                      Ngày {room.ngay_chot_so} hàng tháng
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debt Info */}
          {debtInfo && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Thông Tin Nợ
                  </CardTitle>
                  {debtInfo.hasDebtWarning && (
                    <Badge className="bg-red-500 text-white">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Cảnh báo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng nợ tích lũy</p>
                    <p className={`font-bold text-2xl ${debtInfo.totalDebt > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {formatCurrency(debtInfo.totalDebt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số tháng nợ liên tiếp</p>
                    <div className={`font-bold text-2xl flex items-center gap-2 ${debtInfo.consecutiveMonths >= 2 ? 'text-red-600' :
                      debtInfo.consecutiveMonths > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                      {debtInfo.consecutiveMonths > 0 ? (
                        <>
                          <TrendingUp className="h-5 w-5" />
                          {debtInfo.consecutiveMonths} tháng
                        </>
                      ) : (
                        'Không có nợ'
                      )}
                    </div>
                  </div>
                </div>

                {debtInfo.hasDebtWarning && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-200">
                          Cảnh báo: Phòng này đã nợ {debtInfo.consecutiveMonths} tháng liên tiếp
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Vui lòng liên hệ người thuê để thu tiền.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {debtInfo.unpaidBills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Danh Sách Hóa Đơn Còn Nợ ({debtInfo.unpaidBills.length})
                    </h3>
                    <div className="space-y-2">
                      {debtInfo.unpaidBills.map((bill) => (
                        <Link
                          key={bill.id}
                          href={`/bills/${bill.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium flex items-center gap-2 flex-wrap">
                                  <span>Tháng {bill.month}/{bill.year}</span>
                                  {bill.isPaid && bill.paidAmount > 0 && (
                                    <Badge className="bg-orange-100 text-orange-700 border-none">
                                      Đã thanh toán một phần
                                    </Badge>
                                  )}
                                </div>
                                {bill.notes && (
                                  <p className="text-sm text-muted-foreground">
                                    {bill.notes}
                                  </p>
                                )}
                                {bill.isPaid && bill.paidAmount > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Đã thanh toán: {formatCurrency(bill.paidAmount)} / {formatCurrency(bill.totalCost)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">
                                Còn thiếu: {formatCurrency(bill.remainingDebt)}
                              </p>
                              {bill.isPaid && bill.paidAmount > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tổng: {formatCurrency(bill.totalCost)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {debtInfo.unpaidBills.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Không có hóa đơn chưa thanh toán</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao Tác Nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900 transition-all duration-200"
                onClick={() => router.push(`/bills/create?roomId=${room.id}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Tạo Hóa Đơn Mới
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/rooms?edit=${room.id}`)}
              >
                Sửa Thông Tin Phòng
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
