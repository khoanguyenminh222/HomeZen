"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFeeTypeSchema,
  updateFeeTypeSchema,
} from "@/lib/validations/feeType";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * FeeTypeForm - Form tạo/sửa loại phí
 * Requirements: 6.22-6.24
 */
export default function FeeTypeForm({ open, onClose, feeType, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEdit = !!feeType;

  const form = useForm({
    resolver: zodResolver(isEdit ? updateFeeTypeSchema : createFeeTypeSchema),
    defaultValues: {
      ten_phi: "",
      mo_ta: "",
      trang_thai: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (feeType) {
        form.reset({
          ten_phi: feeType.ten_phi || "",
          mo_ta: feeType.mo_ta || "",
          trang_thai: feeType.trang_thai ?? true,
        });
      } else {
        form.reset({
          ten_phi: "",
          mo_ta: "",
          trang_thai: true,
        });
      }
    }
  }, [open, feeType]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let url;
      let method;

      if (isEdit) {
        url = `/api/settings/fee-types/${feeType.id}`;
        method = "PUT";
      } else {
        url = "/api/settings/fee-types";
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Có lỗi xảy ra");
      }

      const result = await response.json();
      toast({
        title: "Thành công",
        description: isEdit
          ? "Cập nhật loại phí thành công"
          : "Tạo loại phí thành công",
        variant: "success",
      });
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error("Error submitting fee type:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu loại phí",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa Loại Phí" : "Tạo Loại Phí Mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ten_phi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên loại phí *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ví dụ: Wifi, Tiền rác, Tiền gửi xe..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mo_ta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Mô tả về loại phí này (tùy chọn)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trang_thai"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Kích hoạt</FormLabel>
                    <FormDescription>
                      Loại phí này sẽ hiển thị trong danh sách
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Cập nhật" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
