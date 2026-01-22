'use client';

import UtilityRatesForm from '@/components/settings/UtilityRatesForm';
import RoomUtilityRatesList from '@/components/settings/RoomUtilityRatesList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UtilityRatesPage() {
  return (
    <div className="space-y-8">
      {/* Form cấu hình đơn giá chung */}
      <UtilityRatesForm />

      {/* Danh sách phòng và quản lý đơn giá riêng */}
      <RoomUtilityRatesList />

      {/* Hướng dẫn sử dụng */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 text-lg sm:text-xl">Hướng Dẫn Sử Dụng</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200 space-y-2 text-sm sm:text-base">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">1. Đơn Giá Chung</h4>
              <p className="text-sm dark:text-gray-400">
                Áp dụng cho tất cả phòng mặc định. Bao gồm giá điện, giá nước và phương thức tính nước.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">2. Bậc Thang Giá Điện</h4>
              <p className="text-sm dark:text-gray-400">
                Tính giá điện theo bậc thang như điện nhà nước. Bậc thấp giá rẻ, bậc cao giá đắt.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">3. Phương Thức Tính Nước</h4>
              <p className="text-sm dark:text-gray-400">
                • <strong>Theo đồng hồ:</strong> Tiền nước = Số m³ × Giá/m³<br />
                • <strong>Theo số người:</strong> Tiền nước = Số người × Giá/người/tháng
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">4. Đơn Giá Riêng</h4>
              <p className="text-sm dark:text-gray-400">
                Thiết lập đơn giá khác biệt cho từng phòng cụ thể. Ưu tiên cao hơn đơn giá chung.
                Click &ldquo;Thiết lập riêng&rdquo; để tạo đơn giá riêng cho phòng.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}