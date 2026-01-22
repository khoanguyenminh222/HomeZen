'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { FileText, Calendar, Home, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

/**
 * BillList - Danh sách hóa đơn
 * Requirements: 6.1, 7.1-7.4
 */
export default function BillList({ bills, onBillClick }) {
  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Chưa có hóa đơn nào
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Nhấn nút &ldquo;Tạo Hóa Đơn Mới&rdquo; để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {bills.map((bill) => {
        const totalCost = Number(bill.totalCost || 0);
        const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
        const isPartiallyPaid = bill.isPaid && paidAmount > 0 && paidAmount < totalCost;
        const hasRollover = bill.electricityRollover || bill.waterRollover;
        
        return (
          <Card 
            key={bill.id} 
            className="hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
            onClick={() => onBillClick?.(bill)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {bill.room?.code || 'N/A'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {bill.month}/{bill.year}
                    </Badge>
                    {isPartiallyPaid ? (
                      <Badge className="text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">
                        <Clock className="h-3 w-3 mr-1" />
                        Thanh toán một phần
                      </Badge>
                    ) : bill.isPaid ? (
                      <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Đã thanh toán
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                        <XCircle className="h-3 w-3 mr-1" />
                        Chưa thanh toán
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phòng:</span>
                <span className="font-medium">{bill.room?.name || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng tiền:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(bill.totalCost)}
                </span>
              </div>

              {/* Hiển thị thông tin thanh toán một phần */}
              {isPartiallyPaid && (
                <div className="space-y-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Đã đóng:</span>
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      {formatCurrency(paidAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Còn thiếu:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(totalCost - paidAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Cảnh báo đồng hồ xoay vòng - chỉ render khi có */}
              {hasRollover && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Đồng hồ xoay vòng</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm mt-auto">
                <span className="text-muted-foreground">Phí phát sinh:</span>
                <span className="font-medium">
                  {bill.billFees && bill.billFees.length > 0 ? (
                    <span className="text-primary">{bill.billFees.length} phí</span>
                  ) : (
                    <span className="text-muted-foreground">0 phí</span>
                  )}
                </span>
              </div>

              <div className="pt-2 border-t">
                <Link 
                  href={`/bills/${bill.id}`}
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Xem chi tiết →
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
