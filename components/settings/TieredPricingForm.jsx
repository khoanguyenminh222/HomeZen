"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { validateTieredRates } from "@/lib/validations/utilityRate";

export default function TieredPricingForm({
  tieredRates,
  onTieredRatesChange,
}) {
  const [validationError, setValidationError] = useState("");

  // Thêm bậc mới
  const addTier = () => {
    const newTier = {
      muc_tieu_thu_min:
        tieredRates.length > 0
          ? (tieredRates[tieredRates.length - 1].muc_tieu_thu_max || 0) + 1
          : 0,
      muc_tieu_thu_max: null,
      gia: 3000,
    };

    const updatedRates = [...tieredRates, newTier];
    onTieredRatesChange(updatedRates);
    validateRates(updatedRates);
  };

  // Xóa bậc
  const removeTier = (index) => {
    const updatedRates = tieredRates.filter((_, i) => i !== index);
    onTieredRatesChange(updatedRates);
    validateRates(updatedRates);
  };

  // Cập nhật bậc
  const updateTier = (index, field, value) => {
    const updatedRates = [...tieredRates];
    updatedRates[index] = {
      ...updatedRates[index],
      [field]:
        field === "gia" ? parseFloat(value) || 0 : parseInt(value) || null,
    };
    onTieredRatesChange(updatedRates);
    validateRates(updatedRates);
  };

  // Validate các bậc thang
  const validateRates = (rates) => {
    const validation = validateTieredRates(rates);
    if (!validation.isValid) {
      setValidationError(validation.error);
    } else {
      setValidationError("");
      // Cập nhật với rates đã được sắp xếp
      if (validation.sortedRates) {
        onTieredRatesChange(validation.sortedRates);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bậc Thang Giá Điện</CardTitle>
        <CardDescription>
          Cấu hình các bậc giá điện theo quy định của EVN. Bậc cuối cùng sẽ áp
          dụng cho tất cả mức tiêu thụ cao hơn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tieredRates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Chưa có bậc giá nào. Nhấn &ldquo;Thêm Bậc&rdquo; để bắt đầu.</p>
          </div>
        )}

        {tieredRates.map((tier, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Bậc {index + 1}</h4>
              {tieredRates.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeTier(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Row 1: Từ và Đến */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor={`muc_tieu_thu_min-${index}`}
                    className="text-sm font-medium"
                  >
                    Từ (kWh)
                  </Label>
                  {/* Placeholder để đảm bảo height đồng đều */}
                  <div className="h-4">
                    <span className="text-xs text-gray-500 invisible">
                      placeholder
                    </span>
                  </div>
                  <Input
                    id={`muc_tieu_thu_min-${index}`}
                    type="number"
                    min="0"
                    value={tier.muc_tieu_thu_min}
                    onChange={(e) =>
                      updateTier(index, "muc_tieu_thu_min", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor={`muc_tieu_thu_max-${index}`}
                    className="text-sm font-medium"
                  >
                    Đến (kWh)
                  </Label>
                  {/* Luôn có div với height cố định */}
                  <div className="h-4">
                    {index === tieredRates.length - 1 ? (
                      <span className="text-xs text-gray-500">
                        (để trống = không giới hạn)
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 invisible">
                        placeholder
                      </span>
                    )}
                  </div>
                  <Input
                    id={`muc_tieu_thu_max-${index}`}
                    type="number"
                    min="0"
                    value={tier.muc_tieu_thu_max || ""}
                    onChange={(e) =>
                      updateTier(index, "muc_tieu_thu_max", e.target.value)
                    }
                    placeholder={
                      index === tieredRates.length - 1 ? "Không giới hạn" : ""
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Row 2: Giá */}
              <div>
                <Label htmlFor={`gia-${index}`} className="text-sm font-medium">
                  Giá điện (VNĐ/kWh)
                </Label>
                <Input
                  id={`gia-${index}`}
                  type="number"
                  min="0"
                  step="1"
                  value={tier.gia}
                  onChange={(e) => updateTier(index, "gia", e.target.value)}
                  className="mt-1"
                  placeholder="Ví dụ: 3000"
                />
              </div>
            </div>

            {/* Hiển thị mô tả bậc */}
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {tier.muc_tieu_thu_max ? (
                <>
                  Từ {tier.muc_tieu_thu_min} đến {tier.muc_tieu_thu_max} kWh:{" "}
                  {tier.gia?.toLocaleString("vi-VN")} VNĐ/kWh
                </>
              ) : (
                <>
                  Từ {tier.muc_tieu_thu_min} kWh trở lên:{" "}
                  {tier.gia?.toLocaleString("vi-VN")} VNĐ/kWh
                </>
              )}
            </div>
          </div>
        ))}

        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{validationError}</p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={addTier}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Bậc
        </Button>

        {/* Ví dụ tính toán */}
        {tieredRates.length > 0 && !validationError && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ví dụ tính toán</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm space-y-1">
                <p>
                  <strong>Tiêu thụ 150 kWh:</strong>
                </p>
                {tieredRates.map((tier, index) => {
                  const usage150 =
                    Math.min(150, tier.muc_tieu_thu_max || 150) -
                    tier.muc_tieu_thu_min +
                    1;
                  if (usage150 > 0 && tier.muc_tieu_thu_min <= 150) {
                    const actualUsage = Math.max(
                      0,
                      Math.min(usage150, 150 - tier.muc_tieu_thu_min),
                    );
                    if (actualUsage > 0) {
                      return (
                        <p key={index} className="ml-2">
                          • Bậc {index + 1}: {actualUsage} kWh ×{" "}
                          {tier.gia?.toLocaleString("vi-VN")} ={" "}
                          {(actualUsage * tier.gia)?.toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </p>
                      );
                    }
                  }
                  return null;
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
