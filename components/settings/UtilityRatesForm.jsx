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
import { useToast } from "@/hooks/use-toast";
import {
  updateGlobalUtilityRateSchema,
  EVN_TIERED_RATES,
} from "@/lib/validations/utilityRate";
import { Loading } from "@/components/ui/loading";
import TieredPricingForm from "./TieredPricingForm";
import WaterPricingToggle from "./WaterPricingToggle";

export default function UtilityRatesForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [useTieredPricing, setUseTieredPricing] = useState(false);
  const [waterPricingMethod, setWaterPricingMethod] = useState("DONG_HO");
  const [tieredRates, setTieredRates] = useState([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(updateGlobalUtilityRateSchema),
    defaultValues: {
      gia_dien: 3000,
      gia_nuoc: 25000,
      phuong_thuc_tinh_nuoc: "DONG_HO",
      gia_nuoc_theo_nguoi: null,
      su_dung_bac_thang: false,
    },
  });

  // Fetch current utility rates
  useEffect(() => {
    const fetchUtilityRates = async () => {
      try {
        const response = await fetch("/api/settings/utility-rates");
        if (response.ok) {
          const data = (await response.json()) || {};

          // Reset form với dữ liệu từ server
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
          toast({
            title: "Lỗi",
            description: "Không thể tải đơn giá hiện tại",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching utility rates:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải đơn giá hiện tại",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUtilityRates();
  }, [reset, toast]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        su_dung_bac_thang: useTieredPricing,
        phuong_thuc_tinh_nuoc: waterPricingMethod,
        bac_thang_gia: useTieredPricing ? tieredRates : [],
      };

      const response = await fetch("/api/settings/utility-rates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật đơn giá chung",
          variant: "success",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Lỗi",
          description: errorData.error || "Không thể cập nhật đơn giá",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating utility rates:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật đơn giá",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đơn Giá Điện Nước Chung</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="Đang tải cấu hình đơn giá..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            Đơn Giá Điện Nước Chung
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Cấu hình đơn giá mặc định cho tất cả phòng. Có thể thiết lập đơn giá
            riêng cho từng phòng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Giá điện */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="su_dung_bac_thang"
                  checked={useTieredPricing}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setUseTieredPricing(isChecked);
                    setValue("su_dung_bac_thang", isChecked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    // Pre-populate if checked and empty
                    if (
                      isChecked &&
                      (!tieredRates || tieredRates.length === 0)
                    ) {
                      setTieredRates(EVN_TIERED_RATES);
                    }
                  }}
                  className="h-4 w-4 mt-1 shrink-0"
                />
                <Label
                  htmlFor="su_dung_bac_thang"
                  className="text-sm sm:text-base wrap-break-word"
                >
                  Sử dụng bậc thang giá điện (như điện nhà nước)
                </Label>
              </div>

              {!useTieredPricing ? (
                <div>
                  <Label htmlFor="gia_dien" className="text-sm sm:text-base">
                    Giá điện cố định (VNĐ/kWh)
                  </Label>
                  <Input
                    id="gia_dien"
                    type="number"
                    step="1"
                    min="0"
                    {...register("gia_dien", { valueAsNumber: true })}
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
                  onTieredRatesChange={setTieredRates}
                />
              )}
            </div>

            {/* Phương thức tính nước */}
            <WaterPricingToggle
              waterPricingMethod={waterPricingMethod}
              onMethodChange={setWaterPricingMethod}
              register={register}
              errors={errors}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Đang lưu..." : "Lưu Đơn Giá Chung"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
