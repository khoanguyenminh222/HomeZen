"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertyInfoSchema } from "@/lib/validations/propertyInfo";
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
import { Loading } from "../ui/loading";

/**
 * Form cấu hình thông tin nhà trọ
 * Validates: Requirements 4.2-4.6
 */
export default function PropertyInfoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(propertyInfoSchema),
    defaultValues: {
      ten: "",
      dia_chi: "",
      dien_thoai: "",
      ten_chu_nha: "",
      email: "",
      logo_url: "",
      max_dong_ho_dien: 999999,
      max_dong_ho_nuoc: 99999,
    },
  });

  // Fetch thông tin nhà trọ hiện tại
  useEffect(() => {
    async function fetchPropertyInfo() {
      try {
        const response = await fetch("/api/settings/property");
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            reset({
              ten: result.data.ten || "",
              dia_chi: result.data.dia_chi || "",
              dien_thoai: result.data.dien_thoai || "",
              ten_chu_nha: result.data.ten_chu_nha || "",
              email: result.data.email || "",
              logo_url: result.data.logo_url || "",
              max_dong_ho_dien: result.data.max_dong_ho_dien || 999999,
              max_dong_ho_nuoc: result.data.max_dong_ho_nuoc || 99999,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching property info:", error);
        setMessage({
          type: "error",
          text: "Không thể tải thông tin nhà trọ",
        });
      } finally {
        setIsFetching(false);
      }
    }

    fetchPropertyInfo();
  }, [reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/settings/property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: result.message || "Lưu thông tin thành công!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
        });
      }
    } catch (error) {
      console.error("Error saving property info:", error);
      setMessage({
        type: "error",
        text: "Không thể lưu thông tin. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Loading text="Đang tải..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Thông Tin Nhà Trọ</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Cấu hình thông tin nhà trọ để hiển thị trên hóa đơn và báo cáo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tên nhà trọ */}
          <div className="space-y-2">
            <Label htmlFor="ten" className="text-sm sm:text-base">
              Tên nhà trọ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ten"
              {...register("ten")}
              placeholder="VD: Nhà trọ Hòa Bình"
              className="text-base h-12"
            />
            {errors.ten && (
              <p className="text-sm text-red-500">{errors.ten.message}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="dia_chi" className="text-sm sm:text-base">
              Địa chỉ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dia_chi"
              {...register("dia_chi")}
              placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
              className="text-base h-12"
            />
            {errors.dia_chi && (
              <p className="text-sm text-red-500">{errors.dia_chi.message}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="dien_thoai" className="text-sm sm:text-base">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dien_thoai"
              {...register("dien_thoai")}
              placeholder="VD: 0901234567"
              className="text-base h-12"
            />
            {errors.dien_thoai && (
              <p className="text-sm text-red-500">
                {errors.dien_thoai.message}
              </p>
            )}
          </div>

          {/* Tên chủ nhà */}
          <div className="space-y-2">
            <Label htmlFor="ten_chu_nha" className="text-sm sm:text-base">
              Tên chủ nhà / Người quản lý{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ten_chu_nha"
              {...register("ten_chu_nha")}
              placeholder="VD: Nguyễn Văn A"
              className="text-base h-12"
            />
            {errors.ten_chu_nha && (
              <p className="text-sm text-red-500">
                {errors.ten_chu_nha.message}
              </p>
            )}
          </div>

          {/* Email (tùy chọn) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">
              Email (tùy chọn)
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="VD: contact@example.com"
              className="text-base h-12"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Logo URL (tạm thời skip upload, sẽ làm ở Task 26) */}
          <div className="space-y-2">
            <Label htmlFor="logo_url" className="text-sm sm:text-base">
              URL Logo (tùy chọn)
            </Label>
            <Input
              id="logo_url"
              {...register("logo_url")}
              placeholder="Sẽ hỗ trợ upload logo ở phiên bản sau"
              className="text-base h-12"
              disabled
            />
            <p className="text-sm text-gray-500">
              Tính năng upload logo sẽ được thêm vào sau (Task 26)
            </p>
          </div>

          {/* Max chỉ số đồng hồ */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Cấu hình chỉ số đồng hồ</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="max_dong_ho_dien"
                  className="text-sm sm:text-base"
                >
                  Max chỉ số đồng hồ điện{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="max_dong_ho_dien"
                  type="number"
                  {...register("max_dong_ho_dien", { valueAsNumber: true })}
                  placeholder="VD: 999999"
                  className="text-base h-12"
                  min="9999"
                  max="9999999"
                />
                {errors.max_dong_ho_dien && (
                  <p className="text-sm text-red-500">
                    {errors.max_dong_ho_dien.message}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Giá trị tối đa cho đồng hồ điện (mặc định: 999999 - 6 chữ số)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="max_dong_ho_nuoc"
                  className="text-sm sm:text-base"
                >
                  Max chỉ số đồng hồ nước{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="max_dong_ho_nuoc"
                  type="number"
                  {...register("max_dong_ho_nuoc", { valueAsNumber: true })}
                  placeholder="VD: 99999"
                  className="text-base h-12"
                  min="9999"
                  max="9999999"
                />
                {errors.max_dong_ho_nuoc && (
                  <p className="text-sm text-red-500">
                    {errors.max_dong_ho_nuoc.message}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Giá trị tối đa cho đồng hồ nước (mặc định: 99999 - 5 chữ số)
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`p-4 rounded-lg text-base ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? "Đang lưu..." : "Lưu Thông Tin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
