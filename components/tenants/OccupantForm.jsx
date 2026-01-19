'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOccupantSchema } from '@/lib/validations/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function OccupantForm({ tenantId, onSuccess, initialData = null, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(isEdit ? createOccupantSchema.partial() : createOccupantSchema),
    defaultValues: initialData || {
      fullName: '',
      idCard: '',
      dateOfBirth: '',
      hometown: '',
      relationship: '',
      residenceType: 'TEMPORARY'
    }
  });

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
        reset();
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Họ và tên *</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder="Nguyễn Thị B"
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="idCard">CMND/CCCD</Label>
          <Input
            id="idCard"
            {...register('idCard')}
            placeholder="123456789 hoặc 123456789012"
            className={errors.idCard ? 'border-red-500' : ''}
          />
          {errors.idCard && (
            <p className="text-sm text-red-500 mt-1">{errors.idCard.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Ngày sinh</Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth')}
            className={errors.dateOfBirth ? 'border-red-500' : ''}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="relationship">Quan hệ với người thuê</Label>
          <Input
            id="relationship"
            {...register('relationship')}
            placeholder="Vợ/chồng, con, bạn bè..."
            className={errors.relationship ? 'border-red-500' : ''}
          />
          {errors.relationship && (
            <p className="text-sm text-red-500 mt-1">{errors.relationship.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="hometown">Quê quán</Label>
          <Input
            id="hometown"
            {...register('hometown')}
            placeholder="Hà Nội, Việt Nam"
            className={errors.hometown ? 'border-red-500' : ''}
          />
          {errors.hometown && (
            <p className="text-sm text-red-500 mt-1">{errors.hometown.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="residenceType">Loại cư trú</Label>
          <Select
            onValueChange={(value) => setValue('residenceType', value)}
            defaultValue={initialData?.residenceType || 'TEMPORARY'}
          >
            <SelectTrigger className={errors.residenceType ? 'border-red-500' : ''}>
              <SelectValue placeholder="Chọn loại cư trú" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEMPORARY">Tạm trú</SelectItem>
              <SelectItem value="PERMANENT">Thường trú</SelectItem>
            </SelectContent>
          </Select>
          {errors.residenceType && (
            <p className="text-sm text-red-500 mt-1">{errors.residenceType.message}</p>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md">
          {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm người ở')}
        </Button>
      </div>
    </form>
  );
}