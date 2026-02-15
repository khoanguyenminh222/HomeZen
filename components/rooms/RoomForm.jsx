"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoomSchema } from "@/lib/validations/room";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

/**
 * RoomForm - Form tạo/sửa phòng (Dialog)
 * Requirements: 2.1, 2.5, 2.6, 2.7
 */
export default function RoomForm({ open, onClose, room, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEdit = !!room;

  const form = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      ma_phong: "",
      ten_phong: "",
      gia_phong: "",
      trang_thai: "TRONG",
      ngay_chot_so: null,
      max_dong_ho_dien: null,
      max_dong_ho_nuoc: null,
    },
  });

  // Reset form when room changes
  useEffect(() => {
    if (room) {
      form.reset({
        ma_phong: room.ma_phong || "",
        ten_phong: room.ten_phong || "",
        gia_phong: room.gia_phong || "",
        trang_thai: room.trang_thai || "TRONG",
        ngay_chot_so: room.ngay_chot_so || null,
        max_dong_ho_dien: room.max_dong_ho_dien || null,
        max_dong_ho_nuoc: room.max_dong_ho_nuoc || null,
      });
    } else {
      form.reset({
        ma_phong: "",
        ten_phong: "",
        gia_phong: "",
        trang_thai: "TRONG",
        ngay_chot_so: null,
        max_dong_ho_dien: null,
        max_dong_ho_nuoc: null,
      });
    }
  }, [room, form]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/rooms/${room.id}` : "/api/rooms";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Có lỗi xảy ra");
      }

      const result = await response.json();

      toast({
        variant: "success",
        title: "Thành công",
        description: isEdit
          ? "Cập nhật phòng thành công"
          : "Tạo phòng thành công",
      });

      onSuccess(result);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error saving room:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEdit ? "Sửa Phòng" : "Tạo Phòng Mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ma_phong"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Mã phòng *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: A101, B202"
                      className="text-base h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ten_phong"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Tên phòng *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: Phòng tầng 1 số 1"
                      className="text-base h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gia_phong"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Giá phòng (VNĐ) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="VD: 2000000"
                      className="text-base h-12"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Hiển thị text  giá phòng theo format tiền để người dùng dễ nhìn, không input */}
            {form.watch("gia_phong") > 0 && (
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Giá hiển thị: {formatCurrency(form.watch("gia_phong"))}
              </p>
            )}

            <FormField
              control={form.control}
              name="ngay_chot_so"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Ngày chốt số hàng tháng (1-31)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="31"
                      placeholder="VD: 5"
                      className="text-base h-12"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max chỉ số đồng hồ riêng cho phòng */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-base font-semibold">
                Cấu hình chỉ số đồng hồ riêng (tùy chọn)
              </h3>
              <p className="text-sm text-muted-foreground">
                Để trống nếu muốn dùng giá trị chung từ cấu hình nhà trọ
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_dong_ho_dien"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Max chỉ số đồng hồ điện
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="9999"
                          max="9999999"
                          placeholder="Để trống = dùng chung"
                          className="text-base h-12"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_dong_ho_nuoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Max chỉ số đồng hồ nước
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="9999"
                          max="9999999"
                          placeholder="Để trống = dùng chung"
                          className="text-base h-12"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-12 text-base w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 text-base min-w-[120px] w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : isEdit ? (
                  "Cập nhật"
                ) : (
                  "Tạo phòng"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
