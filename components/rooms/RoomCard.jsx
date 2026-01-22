'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { Edit, Trash2, Zap, AlertTriangle, Eye, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import QuickBillDialog from '@/components/bills/QuickBillDialog';

/**
 * RoomCard - Card phòng với trạng thái màu sắc
 * Requirements: 2.5, 12.6, 18.5
 */
export default function RoomCard({ room, onEdit, onDelete, onConfigureUtilityRates }) {
  const [debtInfo, setDebtInfo] = useState(null);
  const [quickBillOpen, setQuickBillOpen] = useState(false);

  // Load debt info cho tất cả phòng (kể cả phòng trống có nợ)
  useEffect(() => {
    fetchDebtInfo();
  }, [room.id]);

  const fetchDebtInfo = async () => {
    try {
      const response = await fetch(`/api/rooms/${room.id}/debt`);
      if (response.ok) {
        const data = await response.json();
        setDebtInfo(data);
      }
    } catch (error) {
      console.error('Error fetching debt info:', error);
    }
  };

  // Màu sắc đơn giản theo trạng thái (Requirements: 12.6)
  const statusColors = {
    EMPTY: 'bg-muted text-muted-foreground',
    OCCUPIED: 'bg-primary text-primary-foreground',
  };

  const statusText = {
    EMPTY: 'Phòng trống',
    OCCUPIED: 'Đã thuê',
  };

  const handleQuickBillSuccess = (bill) => {
    // Refresh debt info sau khi tạo hóa đơn
    fetchDebtInfo();
    // Có thể gọi callback nếu cần
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <Link href={`/rooms/${room.id}`} className="block hover:opacity-80 transition-opacity">
                <CardTitle className="text-lg sm:text-xl font-bold wrap-break-word">{room.code}</CardTitle>
                <p className="text-base text-muted-foreground mt-1 wrap-break-word">
                  {room.name}
                </p>
              </Link>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[room.status]}`}
              >
                {statusText[room.status]}
              </span>
              {debtInfo?.hasDebtWarning && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Nợ {debtInfo.consecutiveMonths} tháng
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div>
            <p className="text-base text-muted-foreground">Giá phòng</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(room.price)}
            </p>
          </div>

          {/* Placeholder để đảm bảo chiều cao đồng đều */}
          <div className="min-h-12">
            {room.meterReadingDay ? (
              <div>
                <p className="text-base text-muted-foreground">
                  Ngày chốt số
                </p>
                <p className="text-base font-medium">
                  Ngày {room.meterReadingDay} hàng tháng
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base text-muted-foreground">
                  Ngày chốt số
                </p>
                <p className="text-base font-medium">
                  Chưa cấu hình
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debt warning for all rooms with outstanding invoices */}
        {debtInfo && debtInfo.totalDebt > 0 && (
          <div className="mb-4">
            <p className="text-base text-muted-foreground">Tổng nợ</p>
            <p className={`text-base font-semibold ${debtInfo.hasDebtWarning ? 'text-destructive' : 'text-bill-unpaid'
              }`}>
              {formatCurrency(debtInfo.totalDebt)}
            </p>
          </div>
        )}

        {/* Nút chính - Xem chi tiết và Tạo hóa đơn nhanh */}
        <div className="pt-4 mt-auto space-y-3">
          {/* Nút Tạo Hóa Đơn Nhanh - chỉ hiển thị cho phòng đã thuê */}
          {room.status === 'OCCUPIED' && (
            <Button
              onClick={() => setQuickBillOpen(true)}
              size="lg"
              className="w-full h-12 bg-bill-paid hover:bg-bill-paid/90 text-primary-foreground font-medium text-base"
            >
              <Receipt className="w-5 h-5 mr-2" />
              Tạo Hóa Đơn Nhanh
            </Button>
          )}

          <Link href={`/rooms/${room.id}`} className="block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500 font-medium text-base"
            >
              <Eye className="w-5 h-5 mr-2" />
              Xem chi tiết phòng
            </Button>
          </Link>

          {/* Các nút phụ - Đơn giản hóa màu sắc */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onEdit(room)}
              variant="outline"
              size="sm"
              className="h-12 text-base font-medium"
              title="Chỉnh sửa thông tin phòng"
            >
              <Edit className="w-4 h-4 mr-1" />
              Sửa
            </Button>
            
            {onConfigureUtilityRates ? (
              <Button
                onClick={() => onConfigureUtilityRates(room)}
                variant="outline"
                size="sm"
                className="h-12 text-base font-medium"
                title="Cấu hình đơn giá điện nước"
              >
                <Zap className="w-4 h-4 mr-1" />
                Đơn giá
              </Button>
            ) : (
              <Button
                onClick={() => onDelete(room)}
                variant="outline"
                size="sm"
                className="h-12 text-base font-medium text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={room.status === 'OCCUPIED'}
                title={room.status === 'OCCUPIED' ? 'Không thể xóa phòng đang thuê' : 'Xóa phòng'}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Xóa
              </Button>
            )}
          </div>
          
          {/* Nút xóa riêng nếu có cả đơn giá và xóa */}
          {onConfigureUtilityRates && (
            <Button
              onClick={() => onDelete(room)}
              variant="outline"
              size="sm"
              className="w-full h-12 text-base font-medium text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={room.status === 'OCCUPIED'}
              title={room.status === 'OCCUPIED' ? 'Không thể xóa phòng đang thuê' : 'Xóa phòng'}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Xóa phòng
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Quick Bill Dialog */}
    <QuickBillDialog
      open={quickBillOpen}
      onClose={() => setQuickBillOpen(false)}
      room={room}
      onSuccess={handleQuickBillSuccess}
    />
    </>
  );
}
