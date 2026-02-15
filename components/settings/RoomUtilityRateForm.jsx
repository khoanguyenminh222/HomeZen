"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  updateRoomUtilityRateSchema,
  EVN_TIERED_RATES,
} from "@/lib/validations/utilityRate";
import { formatCurrency } from "@/lib/format";
import TieredPricingForm from "./TieredPricingForm";
import WaterPricingToggle from "./WaterPricingToggle";
import { Loading } from "@/components/ui/loading";
import { Zap, Droplets, Trash2 } from "lucide-react";

export default function RoomUtilityRateForm({
  room,
  isOpen,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [useTieredPricing, setUseTieredPricing] = useState(false);
  const [waterPricingMethod, setWaterPricingMethod] = useState("DONG_HO");
  const [tieredRates, setTieredRates] = useState([]);
  const [hasCustomRates, setHasCustomRates] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm({
    // Tắt validation client-side, chỉ validate khi submit
    // resolver: zodResolver(updateRoomUtilityRateSchema),
    mode: "onSubmit",
    defaultValues: {
      gia_dien: 3000,
      gia_nuoc: 25000,
      phuong_thuc_tinh_nuoc: "DONG_HO",
      gia_nuoc_theo_nguoi: null,
      su_dung_bac_thang: false,
    },
  });

  // Fetch room's custom utility rates
  useEffect(() => {
    if (!isOpen || !room) return;

    const fetchRoomUtilityRates = async () => {
      setInitialLoading(true);
      try {
        const response = await fetch(`/api/rooms/${room.id}/utility-rates`);

        if (response.ok) {
          const data = await response.json();

          if (data) {
            // Phòng có đơn giá riêng
            setHasCustomRates(true);
            reset({
              gia_dien: data.gia_dien || 3000,
              gia_nuoc: data.gia_nuoc || 25000,
              phuong_thuc_tinh_nuoc: data.phuong_thuc_tinh_nuoc || "DONG_HO",
              gia_nuoc_theo_nguoi: data.gia_nuoc_theo_nguoi,
              su_dung_bac_thang: data.su_dung_bac_thang || false,
            });
            setUseTieredPricing(data.su_dung_bac_thang || false);
            setWaterPricingMethod(data.phuong_thuc_tinh_nuoc || "DONG_HO");
            setTieredRates(data.bac_thang_gia || []);
          } else {
            // Phòng chưa có đơn giá riêng, load đơn giá chung làm mặc định
            setHasCustomRates(false);
            const globalResponse = await fetch("/api/settings/utility-rates");
            if (globalResponse.ok) {
              const globalData = await globalResponse.json();
              // Kiểm tra globalData có tồn tại và hợp lệ không
              if (globalData && typeof globalData === "object") {
                reset({
                  gia_dien: globalData.gia_dien || 3000,
                  gia_nuoc: globalData.gia_nuoc || 25000,
                  phuong_thuc_tinh_nuoc:
                    globalData.phuong_thuc_tinh_nuoc || "DONG_HO",
                  gia_nuoc_theo_nguoi: globalData.gia_nuoc_theo_nguoi,
                  su_dung_bac_thang: globalData.su_dung_bac_thang || false,
                });
                setUseTieredPricing(globalData.su_dung_bac_thang || false);
                setWaterPricingMethod(
                  globalData.phuong_thuc_tinh_nuoc || "DONG_HO",
                );
                setTieredRates(globalData.bac_thang_gia || []);
              } else {
                // Nếu không có dữ liệu, sử dụng giá trị mặc định
                reset({
                  gia_dien: 3000,
                  gia_nuoc: 15000,
                  phuong_thuc_tinh_nuoc: "DONG_HO",
                  gia_nuoc_theo_nguoi: null,
                  su_dung_bac_thang: false,
                });
                setUseTieredPricing(false);
                setWaterPricingMethod("DONG_HO");
                setTieredRates([]);
              }
            }
          }
        } else {
          toast({
            title: "Lỗi",
            description: "Không thể tải đơn giá của phòng",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching room utility rates:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải đơn giá của phòng",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchRoomUtilityRates();
  }, [isOpen, room, reset, toast]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Validate dữ liệu trước khi gửi
      const submitData = {
        gia_dien: data.gia_dien ? Number(data.gia_dien) : null,
        gia_nuoc: data.gia_nuoc ? Number(data.gia_nuoc) : null,
        phuong_thuc_tinh_nuoc: waterPricingMethod,
        gia_nuoc_theo_nguoi: data.gia_nuoc_theo_nguoi
          ? Number(data.gia_nuoc_theo_nguoi)
          : null,
        su_dung_bac_thang: useTieredPricing,
        bac_thang_gia: useTieredPricing ? tieredRates : [],
      };

      // Validate với Zod trước khi gửi API
      const validatedData = updateRoomUtilityRateSchema.parse(submitData);

      const response = await fetch(`/api/rooms/${room.id}/utility-rates`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        setHasCustomRates(true);
        toast({
          title: "Thành công",
          description: `Đã cập nhật đơn giá riêng cho ${room.ten_phong}`,
          variant: "success",
        });
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast({
          title: "Lỗi",
          description: errorData.error || "Không thể cập nhật đơn giá",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating room utility rates:", error);

      if (error.name === "ZodError") {
        toast({
          title: "Lỗi dữ liệu",
          description: "Vui lòng kiểm tra lại thông tin đã nhập",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật đơn giá",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomRates = async () => {
    if (!hasCustomRates) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/utility-rates`, {
        method: "DELETE",
      });

      if (response.ok) {
        setHasCustomRates(false);
        toast({
          title: "Thành công",
          description: `${room.ten_phong} sẽ sử dụng đơn giá chung`,
          variant: "success",
        });
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast({
          title: "Lỗi",
          description: errorData.error || "Không thể xóa đơn giá riêng",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting room utility rates:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa đơn giá riêng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Đơn Giá Riêng - {room.ten_phong}</span>
          </DialogTitle>
          <DialogDescription>
            {hasCustomRates
              ? "Phòng này đang sử dụng đơn giá riêng. Bạn có thể chỉnh sửa hoặc xóa để dùng đơn giá chung."
              : "Phòng này đang sử dụng đơn giá chung. Thiết lập đơn giá riêng để áp dụng giá khác biệt."}
          </DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <Loading text="Đang tải thông tin đơn giá..." />
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Giá điện */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`su_dung_bac_thang-${room?.id}`}
                    checked={useTieredPricing}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setUseTieredPricing(isChecked);
                      setValue("su_dung_bac_thang", isChecked, {
                        shouldDirty: true,
                      });

                      // Pre-populate if checked and empty
                      if (
                        isChecked &&
                        (!tieredRates || tieredRates.length === 0)
                      ) {
                        setTieredRates(EVN_TIERED_RATES);
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`su_dung_bac_thang-${room?.id}`}>
                    Sử dụng bậc thang giá điện
                  </Label>
                </div>

                {!useTieredPricing ? (
                  <div>
                    <Label htmlFor={`gia_dien-${room?.id}`}>
                      Giá điện cố định (VNĐ/kWh)
                    </Label>
                    <Input
                      id={`gia_dien-${room?.id}`}
                      type="number"
                      step="1"
                      min="0"
                      {...register("gia_dien", {
                        valueAsNumber: true,
                      })}
                      className="mt-1"
                    />
                    {errors.gia_dien && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.gia_dien.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <TieredPricingForm
                    tieredRates={tieredRates}
                    onTieredRatesChange={(rates) => {
                      setTieredRates(rates);
                      setValue("bac_thang_gia", rates, { shouldDirty: true });
                    }}
                  />
                )}
              </div>

              {/* Phương thức tính nước */}
              <WaterPricingToggle
                waterPricingMethod={waterPricingMethod}
                onMethodChange={(method) => {
                  setWaterPricingMethod(method);
                  setValue("phuong_thuc_tinh_nuoc", method, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                register={register}
                errors={errors}
                roomId={room?.id}
              />

              <div className="flex space-x-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading
                    ? "Đang lưu..."
                    : hasCustomRates
                      ? "Cập Nhật Đơn Giá Riêng"
                      : "Thiết Lập Đơn Giá Riêng"}
                </Button>

                {hasCustomRates && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteCustomRates}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa & Dùng Chung</span>
                  </Button>
                )}
              </div>
            </form>

            {/* Thông tin hiện tại */}
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-sm">Trạng Thái Hiện Tại</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>Loại đơn giá:</span>
                  <span
                    className={
                      hasCustomRates
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  >
                    {hasCustomRates ? "Đơn giá riêng" : "Đơn giá chung"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mã phòng:</span>
                  <span className="font-medium dark:text-gray-400">
                    {room.ma_phong}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Giá phòng:</span>
                  <span className="font-medium dark:text-gray-400">
                    {formatCurrency(room.gia_phong)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
