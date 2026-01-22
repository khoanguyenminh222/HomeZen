'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, Droplets } from 'lucide-react';

/**
 * MeterHistoryTable - Bảng lịch sử chỉ số điện nước
 * Requirements: 17.4-17.8
 */
export default function MeterHistoryTable({ history }) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Chưa có lịch sử chỉ số nào
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Tạo hóa đơn để bắt đầu theo dõi chỉ số
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="wrap-break-word">Lịch Sử Chỉ Số Điện Nước</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pt-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    Tháng/Năm
                  </th>
                  <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    Điện (kWh)
                  </th>
                  <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
                    Nước (m³)
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-2 sm:p-3">
                      <div className="font-medium text-sm sm:text-base whitespace-nowrap">{item.date}</div>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm whitespace-nowrap">
                          {item.electric.old} → {item.electric.new}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
                            {item.electric.usage} kWh
                          </Badge>
                          {item.electric.rollover && (
                            <Badge className="text-xs flex items-center gap-1 whitespace-nowrap bg-meter-rollover text-white hover:bg-meter-rollover/80 shrink-0 px-1.5 sm:px-2">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Xoay vòng</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm whitespace-nowrap">
                          {item.water.old} → {item.water.new}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
                            {item.water.usage} m³
                          </Badge>
                          {item.water.rollover && (
                            <Badge className="text-xs flex items-center gap-1 whitespace-nowrap bg-meter-rollover text-white hover:bg-meter-rollover/80 shrink-0 px-1.5 sm:px-2">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span className="hidden sm:inline">Xoay vòng</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
