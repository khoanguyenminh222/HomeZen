'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTenantSchema } from '@/lib/validations/tenant';
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
import { formatCurrency } from '@/lib/format';

export default function TenantForm({ onSuccess, initialData = null, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [propertyAddress, setPropertyAddress] = useState('');
  const { toast } = useToast();

  // Helper function to normalize initial data
  const normalizeInitialData = (data) => {
    if (!data) {
      return {
        fullName: '',
        phone: '',
        idCard: '',
        dateOfBirth: '',
        hometown: '',
        moveInDate: '',
        deposit: '',
        roomId: '',
        contractFileUrl: '',
        gender: '',
        occupation: '',
        ethnicity: '',
        nationality: '',
        permanentAddress: '',
        temporaryAddress: '',
        insuranceCardNumber: '',
        issueDate: '',
        placeOfIssue: ''
      };
    }

    return {
      fullName: data.fullName ?? '',
      phone: data.phone ?? '',
      idCard: data.idCard ?? '',
      dateOfBirth: data.dateOfBirth 
        ? new Date(data.dateOfBirth).toISOString().split('T')[0] 
        : '',
      hometown: data.hometown ?? '',
      moveInDate: data.moveInDate 
        ? new Date(data.moveInDate).toISOString().split('T')[0] 
        : '',
      deposit: data.deposit ? String(data.deposit) : '',
      roomId: data.roomId ?? '',
      contractFileUrl: data.contractFileUrl ?? '',
      gender: data.gender ?? '',
      occupation: data.occupation ?? '',
      ethnicity: data.ethnicity ?? '',
      nationality: data.nationality ?? '',
      permanentAddress: data.permanentAddress ?? '',
      temporaryAddress: data.temporaryAddress ?? '',
      insuranceCardNumber: data.insuranceCardNumber ?? '',
      issueDate: data.issueDate 
        ? new Date(data.issueDate).toISOString().split('T')[0] 
        : '',
      placeOfIssue: data.placeOfIssue ?? ''
    };
  };

  const form = useForm({
    resolver: zodResolver(createTenantSchema),
    defaultValues: normalizeInitialData(initialData)
  });

  // Reset form when initialData changes
  useEffect(() => {
    form.reset(normalizeInitialData(initialData));
  }, [initialData, form]);

  // Fetch property address
  useEffect(() => {
    const fetchPropertyAddress = async () => {
      try {
        const response = await fetch('/api/settings/property');
        if (response.ok) {
          const result = await response.json();
          if (result.data?.address) {
            setPropertyAddress(result.data.address);
          }
        }
      } catch (error) {
        console.error('Error fetching property address:', error);
      }
    };

    fetchPropertyAddress();
  }, []);

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

  // Hàm để điền địa chỉ nhà trọ vào địa chỉ tạm trú
  const fillPropertyAddress = () => {
    if (propertyAddress) {
      form.setValue('temporaryAddress', propertyAddress);
    }
  };

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
        contractFileUrl: data.contractFileUrl || null,
        roomId: (data.roomId === 'NONE' || !data.roomId || data.roomId === '') ? null : data.roomId,
        gender: data.gender || null,
        occupation: data.occupation || null,
        ethnicity: data.ethnicity || null,
        nationality: data.nationality || null,
        permanentAddress: data.permanentAddress || null,
        temporaryAddress: data.temporaryAddress || null,
        insuranceCardNumber: data.insuranceCardNumber || null,
        issueDate: data.issueDate || null,
        placeOfIssue: data.placeOfIssue || null
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
        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>

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
                      placeholder="Nguyễn Văn A"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="0901234567"
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
          </div>
        </div>

        {/* Thông tin thuê trọ */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin thuê trọ</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!isEdit || !initialData?.roomId) && (
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phòng (không bắt buộc)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                      value={field.value || 'NONE'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phòng trống" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">-- Không chọn phòng --</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.code} - {room.name} ({new Intl.NumberFormat('vi-VN').format(room.price)} VNĐ)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="moveInDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày vào ở</FormLabel>
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
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || '')}
                    />
                  </FormControl>
                  <FormMessage />
                  {/* Hiển thị text format thành tiền */}
                  {form.watch("deposit") > 0 && (
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      Tiền cọc hiển thị: {formatCurrency(form.watch("deposit"))}
                    </p>
                  )}
                </FormItem>
                
              )}
            />
            
            <FormField
              control={form.control}
              name="contractFileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link file hợp đồng</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin bổ sung</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giới tính</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)}
                    value={field.value || 'NONE'}
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
              name="occupation"
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
              name="ethnicity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dân tộc</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Kinh, Tày, Nùng..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quốc tịch</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Việt Nam"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permanentAddress"
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
              name="temporaryAddress"
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
              name="insuranceCardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số thẻ bảo hiểm</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Số thẻ BHYT/BHXH"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày cấp CMND/CCCD</FormLabel>
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
              name="placeOfIssue"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nơi cấp CMND/CCCD</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Công an quận/huyện..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md">
            {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Thêm người thuê')}
          </Button>
        </div>
      </form>
    </Form>
  );
}