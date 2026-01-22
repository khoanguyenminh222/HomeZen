'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOccupantSchema } from '@/lib/validations/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

export default function OccupantForm({ tenantId, onSuccess, initialData = null, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Helper function to normalize initial data
  const normalizeInitialData = (data) => {
    if (!data) {
      return {
        fullName: '',
        idCard: '',
        dateOfBirth: '',
        hometown: '',
        relationship: '',
        residenceType: 'TEMPORARY'
      };
    }

    return {
      fullName: data.fullName ?? '',
      idCard: data.idCard ?? '',
      dateOfBirth: data.dateOfBirth 
        ? new Date(data.dateOfBirth).toISOString().split('T')[0] 
        : '',
      hometown: data.hometown ?? '',
      relationship: data.relationship ?? '',
      residenceType: data.residenceType ?? 'TEMPORARY'
    };
  };

  const form = useForm({
    resolver: zodResolver(isEdit ? createOccupantSchema.partial() : createOccupantSchema),
    defaultValues: normalizeInitialData(initialData)
  });

  // Reset form when initialData changes
  useEffect(() => {
    form.reset(normalizeInitialData(initialData));
  }, [initialData, form]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Format data
      const formattedData = {
        ...data,
        idCard: data.idCard || null,
        dateOfBirth: data.dateOfBirth || null,
        hometown: data.hometown || null,
        relationship: data.relationship || null
      };

      const url = isEdit
        ? `/api/tenants/${tenantId}/occupants/${initialData.id}`
        : `/api/tenants/${tenantId}/occupants`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra');
      }

      toast({
        title: 'Thành công',
        description: isEdit ? 'Đã cập nhật thông tin người ở' : 'Đã thêm người ở mới',
        variant: 'success'
      });

      if (onSuccess) {
        onSuccess();
      }

      if (!isEdit) {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
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
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Nguyễn Thị B"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idCard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CMND/CCCD</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="123456789 hoặc 123456789012"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày sinh</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quan hệ với người thuê</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Vợ/chồng, con, bạn bè..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hometown"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Quê quán</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Hà Nội, Việt Nam"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residenceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại cư trú</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || 'TEMPORARY'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại cư trú" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TEMPORARY">Tạm trú</SelectItem>
                    <SelectItem value="PERMANENT">Thường trú</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit button */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md">
            {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm người ở')}
          </Button>
        </div>
      </form>
    </Form>
  );
}