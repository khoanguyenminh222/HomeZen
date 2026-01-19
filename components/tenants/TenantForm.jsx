'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTenantSchema } from '@/lib/validations/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function TenantForm({ onSuccess, initialData = null, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(createTenantSchema),
    defaultValues: initialData || {
      fullName: '',
      phone: '',
      idCard: '',
      dateOfBirth: '',
      hometown: '',
      moveInDate: '',
      deposit: '',
      roomId: '',
      contractFileUrl: ''
    }
  });

  // Fetch available rooms (only empty rooms for new tenant)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms?status=EMPTY');
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const data = await response.json();
        setRooms(data);
        console.log(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách phòng trống',
          variant: 'destructive'
        });
      }
    };

    if (!isEdit || !initialData?.roomId) {
      fetchRooms();
    }
  }, [isEdit, initialData?.roomId, toast]);

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
        moveInDate: data.moveInDate || null,
        deposit: data.deposit ? parseFloat(data.deposit) : null,
        contractFileUrl: data.contractFileUrl || null
      };

      const url = isEdit ? `/api/tenants/${initialData.id}` : '/api/tenants';
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
        description: isEdit ? 'Đã cập nhật thông tin người thuê' : 'Đã thêm người thuê mới',
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
      {/* Thông tin cơ bản */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Họ và tên *</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Nguyễn Văn A"
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Số điện thoại *</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="0901234567"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
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
        </div>
      </div>

      {/* Thông tin thuê trọ */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Thông tin thuê trọ</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(!isEdit || !initialData?.roomId) && (
            <div>
              <Label htmlFor="roomId">Phòng (không bắt buộc)</Label>
              <Select onValueChange={(value) => setValue('roomId', value === 'NONE' ? null : value)}>
                <SelectTrigger className={errors.roomId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Chọn phòng trống" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">-- Không chọn phòng --</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.code} - {room.name} ({new Intl.NumberFormat('vi-VN').format(room.price)} VNĐ)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomId && (
                <p className="text-sm text-red-500 mt-1">{errors.roomId.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="moveInDate">Ngày vào ở</Label>
            <Input
              id="moveInDate"
              type="date"
              {...register('moveInDate')}
              className={errors.moveInDate ? 'border-red-500' : ''}
            />
            {errors.moveInDate && (
              <p className="text-sm text-red-500 mt-1">{errors.moveInDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deposit">Tiền cọc (VNĐ)</Label>
            <Input
              id="deposit"
              type="number"
              min="0"
              step="1000"
              {...register('deposit')}
              placeholder="0"
              className={errors.deposit ? 'border-red-500' : ''}
            />
            {errors.deposit && (
              <p className="text-sm text-red-500 mt-1">{errors.deposit.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contractFileUrl">Link file hợp đồng</Label>
            <Input
              id="contractFileUrl"
              type="url"
              {...register('contractFileUrl')}
              placeholder="https://..."
              className={errors.contractFileUrl ? 'border-red-500' : ''}
            />
            {errors.contractFileUrl && (
              <p className="text-sm text-red-500 mt-1">{errors.contractFileUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md">
          {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm người thuê')}
        </Button>
      </div>
    </form>
  );
}