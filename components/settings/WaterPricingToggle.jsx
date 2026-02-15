"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WaterPricingToggle({
  waterPricingMethod,
  onMethodChange,
  register,
  errors,
  roomId = "default",
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
              value="DONG_HO"
              checked={waterPricingMethod === "DONG_HO"}
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
              value="THEO_NGUOI"
              checked={waterPricingMethod === "THEO_NGUOI"}
              onChange={(e) => onMethodChange(e.target.value)}
              className="h-4 w-4"
            />
            <Label htmlFor={`person-method-${roomId}`} className="font-medium">
              Theo số người (VNĐ/người/tháng)
            </Label>
          </div>
        </div>

        {/* Form fields tương ứng */}
        {waterPricingMethod === "DONG_HO" ? (
          <div className="space-y-2">
            <Label htmlFor={`gia_nuoc-${roomId}`}>
              Giá nước theo đồng hồ (VNĐ/m³)
            </Label>
            <Input
              id={`gia_nuoc-${roomId}`}
              type="number"
              step="1"
              min="0"
              {...register("gia_nuoc", {
                valueAsNumber: true,
                onChange: () => {}, // Trigger dirty state
              })}
              className="mt-1"
              placeholder="Ví dụ: 25000"
            />
            {errors.gia_nuoc && (
              <p className="text-sm text-red-600">{errors.gia_nuoc.message}</p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tiền nước = Số m³ tiêu thụ × Giá nước/m³
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`gia_nuoc_theo_nguoi-${roomId}`}>
              Giá nước theo người (VNĐ/người/tháng)
            </Label>
            <Input
              id={`gia_nuoc_theo_nguoi-${roomId}`}
              type="number"
              step="1"
              min="0"
              {...register("gia_nuoc_theo_nguoi", {
                valueAsNumber: true,
                onChange: () => {}, // Trigger dirty state
              })}
              className="mt-1"
              placeholder="Ví dụ: 100000"
            />
            {errors.gia_nuoc_theo_nguoi && (
              <p className="text-sm text-red-600">
                {errors.gia_nuoc_theo_nguoi.message}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tiền nước = Số người ở × Giá nước/người/tháng
            </p>
          </div>
        )}

        {/* Ví dụ tính toán */}
        <div className="bg-blue-50 border border-blue-200 dark:bg-gray-900 dark:border-gray-800 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Ví dụ tính toán:
          </h4>
          {waterPricingMethod === "DONG_HO" ? (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>• Phòng tiêu thụ 5 m³ nước</p>
              <p>• Giá nước: 25.000 VNĐ/m³</p>
              <p>
                • <strong>Tiền nước = 5 × 25.000 = 125.000 VNĐ</strong>
              </p>
            </div>
          ) : (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>• Phòng có 3 người ở</p>
              <p>• Giá nước: 100.000 VNĐ/người/tháng</p>
              <p>
                • <strong>Tiền nước = 3 × 100.000 = 300.000 VNĐ</strong>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
