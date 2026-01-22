'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { Edit, Trash2, Zap, AlertTriangle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/**
 * RoomCard - Card phòng với trạng thái màu sắc
 * Requirements: 2.5, 12.6, 18.5
 */
export default function RoomCard({ room, onEdit, onDelete, onConfigureUtilityRates }) {
  const [debtInfo, setDebtInfo] = useState(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  // Load debt info cho tất cả phòng (kể cả phòng trống có nợ)
  useEffect(() => {
    fetchDebtInfo();
  }, [room.id]);

  const fetchDebtInfo = async () => {
    try {
      setLoadingDebt(true);
      const response = await fetch(`/api/rooms/${room.id}/debt`);
      if (response.ok) {
        const data = await response.json();
        setDebtInfo(data);
      }
    } catch (error) {
      console.error('Error fetching debt info:', error);
    } finally {
      setLoadingDebt(false);
    }
  };

  // Màu sắc theo trạng thái (Requirements: 12.6)
  const statusColors = {
    EMPTY: 'bg-gray-500 text-white',
    OCCUPIED: 'bg-emerald-500 text-white',
  };

  const statusText = {
    EMPTY: 'Phòng trống',
    OCCUPIED: 'Đã thuê',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/rooms/${room.id}`} className="block hover:opacity-80 transition-opacity">
              <CardTitle className="text-lg sm:text-xl font-bold wrap-break-word">{room.code}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                {room.name}
              </p>
            </Link>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusColors[room.status]}`}
            >
              {statusText[room.status]}
            </span>
            {debtInfo?.hasDebtWarning && (
              <Badge className="bg-red-500 text-white text-xs hover:bg-red-500 hover:text-white">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Nợ {debtInfo.consecutiveMonths} tháng
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div>
            <p className="text-sm text-muted-foreground">Giá phòng</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(room.price)}
            </p>
          </div>

          {/* Placeholder để đảm bảo chiều cao đồng đều */}
          <div className="min-h-12">
            {room.meterReadingDay ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  Ngày chốt số
                </p>
                <p className="text-base font-medium">
                  Ngày {room.meterReadingDay} hàng tháng
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
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
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Tổng nợ</p>
            <p className={`text-sm font-semibold ${debtInfo.hasDebtWarning ? 'text-red-600' : 'text-orange-600'
              }`}>
              {formatCurrency(debtInfo.totalDebt)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-4 mt-auto">
          <Link href={`/rooms/${room.id}`} className="col-span-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-10 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900 transition-all duration-200"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium">Chi tiết</span>
            </Button>
          </Link>
          <Button
            onClick={() => onEdit(room)}
            variant="outline"
            size="sm"
            className="col-span-1 h-10 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900 transition-all duration-200"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4 mr-1.5" />
            <span className="text-xs font-medium">Sửa</span>
          </Button>
          {onConfigureUtilityRates && (
            <Button
              onClick={() => onConfigureUtilityRates(room)}
              variant="outline"
              size="sm"
              className="col-span-1 h-10 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900 transition-all duration-200"
              title="Cấu hình đơn giá"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium">Đơn giá</span>
            </Button>
          )}
          <Button
            onClick={() => onDelete(room)}
            variant="outline"
            size="sm"
            className="col-span-1 h-10 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50 dark:disabled:hover:bg-red-950"
            disabled={room.status === 'OCCUPIED'}
            title={room.status === 'OCCUPIED' ? 'Không thể xóa phòng đang thuê' : 'Xóa phòng'}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            <span className="text-xs font-medium">Xóa</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
