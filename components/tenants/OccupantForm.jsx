"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOccupantSchema } from "@/lib/validations/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function OccupantForm({
  tenantId,
  onSuccess,
  initialData = null,
  isEdit = false,
}) {
  const [loading, setLoading] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState("");
  const { toast } = useToast();

  // Helper function to normalize initial data
  const normalizeInitialData = (data) => {
    if (!data) {
      return {
        ho_ten: "",
        can_cuoc: "",
        ngay_sinh: "",
        que_quan: "",
        moi_quan_he: "",
        loai_cu_tru: "TAM_TRU",
        dien_thoai: "",
        gioi_tinh: "",
        nghe_nghiep: "",
        dan_toc: "",
        quoc_tich: "",
        dia_chi_thuong_tru: "",
        dia_chi_tam_tru: "",
        so_the_bao_hiem: "",
        ngay_cap: "",
        noi_cap: "",
      };
    }

    return {
      ho_ten: data.ho_ten ?? "",
      can_cuoc: data.can_cuoc ?? "",
      ngay_sinh: data.ngay_sinh
        ? new Date(data.ngay_sinh).toISOString().split("T")[0]
        : "",
      que_quan: data.que_quan ?? "",
      moi_quan_he: data.moi_quan_he ?? "",
      loai_cu_tru: data.loai_cu_tru ?? "TAM_TRU",
      dien_thoai: data.dien_thoai ?? "",
      gioi_tinh: data.gioi_tinh ?? "",
      nghe_nghiep: data.nghe_nghiep ?? "",
      dan_toc: data.dan_toc ?? "",
      quoc_tich: data.quoc_tich ?? "",
      dia_chi_thuong_tru: data.dia_chi_thuong_tru ?? "",
      dia_chi_tam_tru: data.dia_chi_tam_tru ?? "",
      so_the_bao_hiem: data.so_the_bao_hiem ?? "",
      ngay_cap: data.ngay_cap
        ? new Date(data.ngay_cap).toISOString().split("T")[0]
        : "",
      noi_cap: data.noi_cap ?? "",
    };
  };

  const form = useForm({
    resolver: zodResolver(
      isEdit ? createOccupantSchema.partial() : createOccupantSchema,
    ),
    defaultValues: normalizeInitialData(initialData),
  });

  // Fetch property address
  useEffect(() => {
    const fetchPropertyAddress = async () => {
      try {
        const response = await fetch("/api/settings/property");
        if (response.ok) {
          const result = await response.json();
          if (result.data?.dia_chi) {
            setPropertyAddress(result.data.dia_chi);
          }
        }
      } catch (error) {
        console.error("Error fetching property address:", error);
      }
    };

    fetchPropertyAddress();
  }, []);

  // Reset form when initialData changes
  useEffect(() => {
    form.reset(normalizeInitialData(initialData));
  }, [initialData, form]);

  // Hàm để điền địa chỉ nhà trọ vào địa chỉ tạm trú
  const fillPropertyAddress = () => {
    if (propertyAddress) {
      form.setValue("dia_chi_tam_tru", propertyAddress);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Format data
      const formattedData = {
        ...data,
        can_cuoc: data.can_cuoc || null,
        ngay_sinh: data.ngay_sinh || null,
        que_quan: data.que_quan || null,
        moi_quan_he: data.moi_quan_he || null,
        dien_thoai: data.dien_thoai || null,
        gioi_tinh: data.gioi_tinh || null,
        nghe_nghiep: data.nghe_nghiep || null,
        dan_toc: data.dan_toc || null,
        quoc_tich: data.quoc_tich || null,
        dia_chi_thuong_tru: data.dia_chi_thuong_tru || null,
        dia_chi_tam_tru: data.dia_chi_tam_tru || null,
        so_the_bao_hiem: data.so_the_bao_hiem || null,
        ngay_cap: data.ngay_cap || null,
        noi_cap: data.noi_cap || null,
      };

      const url = isEdit
        ? `/api/tenants/${tenantId}/occupants/${initialData.id}`
        : `/api/tenants/${tenantId}/occupants`;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Có lỗi xảy ra");
      }

      toast({
        title: "Thành công",
        description: isEdit
          ? "Đã cập nhật thông tin người ở"
          : "Đã thêm người ở mới",
        variant: "success",
      });

      if (onSuccess) {
        onSuccess();
      }

      if (!isEdit) {
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ho_ten"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nguyễn Thị B" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="can_cuoc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CMND/CCCD</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123456789 hoặc 123456789012" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ngay_sinh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày sinh</FormLabel>
                <FormControl>
                  <Input {...field} type="date" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moi_quan_he"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quan hệ với người thuê</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Vợ/chồng, con, bạn bè..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="que_quan"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Quê quán</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Hà Nội, Việt Nam" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loai_cu_tru"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại cư trú</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "TAM_TRU"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại cư trú" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TAM_TRU">Tạm trú</SelectItem>
                    <SelectItem value="THUONG_TRU">Thường trú</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dien_thoai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="0901234567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Thông tin bổ sung */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin bổ sung</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gioi_tinh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giới tính</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "NONE" ? "" : value)
                    }
                    value={field.value || "NONE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">-- Không chọn --</SelectItem>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nghe_nghiep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nghề nghiệp</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Công nhân, Nhân viên văn phòng..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dan_toc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dân tộc</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Kinh, Tày, Nùng..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quoc_tich"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quốc tịch</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Việt Nam" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dia_chi_thuong_tru"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Địa chỉ thường trú</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dia_chi_tam_tru"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Địa chỉ tạm trú</FormLabel>
                    {propertyAddress && (
                      <button
                        type="button"
                        onClick={fillPropertyAddress}
                        className="text-xs text-primary hover:text-primary/80 underline"
                      >
                        Điền địa chỉ nhà trọ
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Địa chỉ phòng trọ hiện tại"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="so_the_bao_hiem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số thẻ bảo hiểm</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Số thẻ BHYT/BHXH" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ngay_cap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày cấp CMND/CCCD</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noi_cap"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nơi cấp CMND/CCCD</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Công an quận/huyện..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md"
          >
            {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm người ở"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
