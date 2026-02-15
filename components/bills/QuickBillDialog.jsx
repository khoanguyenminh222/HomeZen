"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Zap, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Loading } from "../ui/loading";

/**
 * QuickBillDialog - Dialog tạo hóa đơn nhanh với chỉ 2 trường: số điện mới, số nước mới
 * Requirements: 12.11, 12.12, 14.5
 */
const quickBillSchema = z.object({
  chi_so_dien_moi: z.number().int().min(0, "Chỉ số điện mới không được âm"),
  chi_so_nuoc_moi: z.number().int().min(0, "Chỉ số nước mới không được âm"),
});

export default function QuickBillDialog({ open, onClose, room, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLastBill, setIsLoadingLastBill] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [preview, setPreview] = useState(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(quickBillSchema),
    defaultValues: {
      chi_so_dien_moi: 0,
      chi_so_nuoc_moi: 0,
    },
  });

  // Fetch last bill khi mở dialog
  useEffect(() => {
    if (open && room?.id) {
      fetchLastBill();
    } else {
      form.reset();
      setLastBill(null);
      setPreview(null);
    }
  }, [open, room?.id]);

  const fetchLastBill = async () => {
    if (!room?.id) return;

    setIsLoadingLastBill(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Tìm hóa đơn tháng trước
      let month = currentMonth - 1;
      let year = currentYear;
      if (month === 0) {
        month = 12;
        year = year - 1;
      }

      const response = await fetch(
        `/api/bills?roomId=${room.id}&month=${month}&year=${year}`,
      );
      if (!response.ok) throw new Error("Failed to fetch last bill");
      const data = await response.json();

      if (data.length > 0) {
        const last = data[0];
        setLastBill(last);
        // Auto-fill số cũ từ hóa đơn trước
        form.setValue("chi_so_dien_moi", last.chi_so_dien_moi);
        form.setValue("chi_so_nuoc_moi", last.chi_so_nuoc_moi);
      } else {
        setLastBill(null);
        form.setValue("chi_so_dien_moi", 0);
        form.setValue("chi_so_nuoc_moi", 0);
      }
    } catch (error) {
      console.error("Error fetching last bill:", error);
      setLastBill(null);
    } finally {
      setIsLoadingLastBill(false);
    }
  };

  // Tính toán preview khi thay đổi giá trị
  const calculatePreview = async (newElectric, newWater) => {
    if (!room?.id || !newElectric || !newWater) {
      setPreview(null);
      return;
    }

    try {
      // Lấy số cũ
      const oldElectric = lastBill?.chi_so_dien_moi || 0;
      const oldWater = lastBill?.chi_so_nuoc_moi || 0;

      // Gọi API để tính toán (sử dụng endpoint tạm thời hoặc tính toán client-side)
      // Tạm thời chỉ hiển thị usage
      const electricUsage =
        newElectric >= oldElectric
          ? newElectric - oldElectric
          : 999999 - oldElectric + newElectric; // Giả định max meter = 999999

      const waterUsage =
        newWater >= oldWater
          ? newWater - oldWater
          : 999999 - oldWater + newWater;

      setPreview({
        chi_so_dien_cu: oldElectric,
        chi_so_dien_moi: newElectric,
        electricityUsage: electricUsage,
        chi_so_nuoc_cu: oldWater,
        chi_so_nuoc_moi: newWater,
        waterUsage: waterUsage,
      });
    } catch (error) {
      console.error("Error calculating preview:", error);
      setPreview(null);
    }
  };

  // Watch form values để tính preview
  const newElectric = form.watch("chi_so_dien_moi");
  const newWater = form.watch("chi_so_nuoc_moi");

  useEffect(() => {
    if (newElectric && newWater) {
      calculatePreview(newElectric, newWater);
    }
  }, [newElectric, newWater, lastBill]);

  const onSubmit = async (data) => {
    if (!room?.id) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy thông tin phòng",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Lấy số cũ từ last bill hoặc 0
      const chi_so_dien_cu = lastBill?.chi_so_dien_moi || 0;
      const chi_so_nuoc_cu = lastBill?.chi_so_nuoc_moi || 0;

      // Tạo hóa đơn
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phong_id: room.id,
          thang: month,
          nam: year,
          chi_so_dien_cu,
          chi_so_dien_moi: data.chi_so_dien_moi,
          chi_so_nuoc_cu,
          chi_so_nuoc_moi: data.chi_so_nuoc_moi,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Có lỗi xảy ra khi tạo hóa đơn");
      }

      const bill = await response.json();

      toast({
        variant: "success",
        title: "Thành công",
        description: "Tạo hóa đơn thành công",
      });

      onSuccess?.(bill);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo hóa đơn",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const oldElectricReading = lastBill?.chi_so_dien_moi || 0;
  const oldWaterReading = lastBill?.chi_so_nuoc_moi || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Tạo Hóa Đơn Nhanh
          </DialogTitle>
          <DialogDescription className="text-base">
            Phòng: <span className="font-semibold">{room?.ma_phong}</span> -{" "}
            {room?.ten_phong}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Chỉ số cũ (read-only) */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Chỉ số điện cũ
                </p>
                {isLoadingLastBill ? (
                  <Loading text="Đang tải..." />
                ) : (
                  <p className="text-base font-semibold">
                    {oldElectricReading.toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Chỉ số nước cũ
                </p>
                {isLoadingLastBill ? (
                  <Loading text="Đang tải..." />
                ) : (
                  <p className="text-base font-semibold">
                    {oldWaterReading.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Chỉ số mới */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="chi_so_dien_moi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Chỉ số điện mới
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nhập chỉ số điện mới"
                        className="text-base h-12"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chi_so_nuoc_moi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      Chỉ số nước mới
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Nhập chỉ số nước mới"
                        className="text-base h-12"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-primary mb-2">
                  Xác nhận:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tiêu thụ điện:</p>
                    <p className="font-semibold">
                      {preview.electricityUsage.toLocaleString()} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tiêu thụ nước:</p>
                    <p className="font-semibold">
                      {preview.waterUsage.toLocaleString()} m³
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 text-base"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-12 text-base"
                disabled={isSubmitting || isLoadingLastBill}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Tạo Hóa Đơn
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
