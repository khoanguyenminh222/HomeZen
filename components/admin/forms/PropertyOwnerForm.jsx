"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { propertyInfoSchema } from "@/lib/validations/propertyInfo";

// Extend schema for user account fields
const createFormSchema = (isEdit, isPropertyEditOnly = false) => {
  let baseSchema = propertyInfoSchema;

  // If not property-only edit, add user account validations
  if (!isPropertyEditOnly) {
    baseSchema = baseSchema.extend({
      tai_khoan: z
        .string()
        .min(3, "Username tối thiểu 3 ký tự")
        .max(50, "Username tối đa 50 ký tự")
        .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và gạch dưới"),
      // Password is optional in edit mode
      mat_khau: isEdit
        ? z.string().optional()
        : z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    });
  } else {
    // In property-only mode, these fields are optional/ignored by validation
    baseSchema = baseSchema.extend({
      tai_khoan: z.string().optional(),
      mat_khau: z.string().optional(),
    });
  }

  return baseSchema;
};

export default function PropertyOwnerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isEdit = false,
  isPropertyEditOnly = false, // Flag for property-only edit (no username/mat_khau fields)
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare default values
  const initialValues = {
    tai_khoan:
      defaultValues?.nguoi_dung?.tai_khoan || defaultValues?.tai_khoan || "",
    mat_khau: "",
    // Map from database field names (thong_tin_nha_tro)
    ten: defaultValues?.thong_tin_nha_tro?.ten || defaultValues?.ten || "",
    dia_chi:
      defaultValues?.thong_tin_nha_tro?.dia_chi || defaultValues?.dia_chi || "",
    dien_thoai:
      defaultValues?.thong_tin_nha_tro?.dien_thoai ||
      defaultValues?.dien_thoai ||
      "",
    ten_chu_nha:
      defaultValues?.thong_tin_nha_tro?.ten_chu_nha ||
      defaultValues?.ten_chu_nha ||
      "",
    email:
      defaultValues?.thong_tin_nha_tro?.email || defaultValues?.email || "",
    logo_url:
      defaultValues?.thong_tin_nha_tro?.logo_url ||
      defaultValues?.logo_url ||
      "",
    max_dong_ho_dien:
      defaultValues?.thong_tin_nha_tro?.max_dong_ho_dien ||
      defaultValues?.max_dong_ho_dien ||
      999999,
    max_dong_ho_nuoc:
      defaultValues?.thong_tin_nha_tro?.max_dong_ho_nuoc ||
      defaultValues?.max_dong_ho_nuoc ||
      99999,
  };

  const form = useForm({
    resolver: zodResolver(createFormSchema(isEdit, isPropertyEditOnly)),
    defaultValues: initialValues,
  });

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Send values as is, they now match API/Schema expectations
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* User Account Fields - Hide if property edit only */}
          {!isPropertyEditOnly && (
            <>
              <FormField
                aria-label="tai_khoan"
                control={form.control}
                name="tai_khoan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Username <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isEdit}
                        placeholder="Username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEdit && (
                <FormField
                  control={form.control}
                  name="mat_khau"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Mật khẩu <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          placeholder="Mật khẩu"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {/* Property Info Fields */}
          <FormField
            control={form.control}
            name="ten"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tên nhà trọ <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tên nhà trọ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dia_chi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Địa chỉ <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Địa chỉ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dien_thoai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Số điện thoại <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Số điện thoại" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ten_chu_nha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tên chủ nhà <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tên chủ nhà" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} placeholder="Email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_dong_ho_dien"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Đồng hồ điện</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
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
                <FormLabel>Max Đồng hồ nước</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
