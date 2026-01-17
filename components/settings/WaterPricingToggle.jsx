'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WaterPricingToggle({ 
  waterPricingMethod, 
  onMethodChange, 
  register, 
  errors,
  roomId = 'default'
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Phương Thức Tính Nước</CardTitle>
        <CardDescription>
          Chọn cách tính tiền nước: theo đồng hồ hoặc theo số người ở
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle giữa 2 phương thức */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`meter-method-${roomId}`}
              name={`waterPricingMethod-${roomId}`}
              value="METER"
              checked={waterPricingMethod === 'METER'}
              onChange={(e) => onMethodChange(e.target.value)}
              className="h-4 w-4"
            />
            <Label htmlFor={`meter-method-${roomId}`} className="font-medium">
              Theo đồng hồ (VNĐ/m³)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`person-method-${roomId}`}
              name={`waterPricingMethod-${roomId}`}
              value="PERSON"
              checked={waterPricingMethod === 'PERSON'}
              onChange={(e) => onMethodChange(e.target.value)}
              className="h-4 w-4"
            />
            <Label htmlFor={`person-method-${roomId}`} className="font-medium">
              Theo số người (VNĐ/người/tháng)
            </Label>
          </div>
        </div>

        {/* Form fields tương ứng */}
        {waterPricingMethod === 'METER' ? (
          <div className="space-y-2">
            <Label htmlFor={`waterPrice-${roomId}`}>Giá nước theo đồng hồ (VNĐ/m³)</Label>
            <Input
              id={`waterPrice-${roomId}`}
              type="number"
              step="1000"
              min="0"
              {...register('waterPrice', { 
                valueAsNumber: true,
                onChange: () => {} // Trigger dirty state
              })}
              className="mt-1"
              placeholder="Ví dụ: 25000"
            />
            {errors.waterPrice && (
              <p className="text-sm text-red-600">
                {errors.waterPrice.message}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Tiền nước = Số m³ tiêu thụ × Giá nước/m³
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`waterPricePerPerson-${roomId}`}>Giá nước theo người (VNĐ/người/tháng)</Label>
            <Input
              id={`waterPricePerPerson-${roomId}`}
              type="number"
              step="10000"
              min="0"
              {...register('waterPricePerPerson', { 
                valueAsNumber: true,
                onChange: () => {} // Trigger dirty state
              })}
              className="mt-1"
              placeholder="Ví dụ: 100000"
            />
            {errors.waterPricePerPerson && (
              <p className="text-sm text-red-600">
                {errors.waterPricePerPerson.message}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Tiền nước = Số người ở × Giá nước/người/tháng
            </p>
          </div>
        )}

        {/* Ví dụ tính toán */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Ví dụ tính toán:</h4>
          {waterPricingMethod === 'METER' ? (
            <div className="text-sm text-blue-800">
              <p>• Phòng tiêu thụ 5 m³ nước</p>
              <p>• Giá nước: 25.000 VNĐ/m³</p>
              <p>• <strong>Tiền nước = 5 × 25.000 = 125.000 VNĐ</strong></p>
            </div>
          ) : (
            <div className="text-sm text-blue-800">
              <p>• Phòng có 3 người ở</p>
              <p>• Giá nước: 100.000 VNĐ/người/tháng</p>
              <p>• <strong>Tiền nước = 3 × 100.000 = 300.000 VNĐ</strong></p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}