'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Edit, Trash2, Zap } from 'lucide-react';

/**
 * RoomCard - Card phòng với trạng thái màu sắc
 * Requirements: 2.5, 12.6
 */
export default function RoomCard({ room, onEdit, onDelete, onConfigureUtilityRates }) {
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{room.code}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {room.name}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[room.status]}`}
          >
            {statusText[room.status]}
          </span>
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
              <div className="h-12"></div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 mt-auto">
          <Button
            onClick={() => onEdit(room)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Sửa
          </Button>
          {onConfigureUtilityRates && (
            <Button
              onClick={() => onConfigureUtilityRates(room)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Đơn giá
            </Button>
          )}
          <Button
            onClick={() => onDelete(room)}
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={room.status === 'OCCUPIED'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
