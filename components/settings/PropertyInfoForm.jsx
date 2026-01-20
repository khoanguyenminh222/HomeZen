'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertyInfoSchema } from '@/lib/validations/propertyInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Form cấu hình thông tin nhà trọ
 * Validates: Requirements 4.2-4.6
 */
export default function PropertyInfoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(propertyInfoSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      ownerName: '',
      email: '',
      logoUrl: '',
      maxElectricMeter: 999999,
      maxWaterMeter: 99999,
    },
  });

  // Fetch thông tin nhà trọ hiện tại
  useEffect(() => {
    async function fetchPropertyInfo() {
      try {
        const response = await fetch('/api/settings/property');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            reset({
              name: result.data.name || '',
              address: result.data.address || '',
              phone: result.data.phone || '',
              ownerName: result.data.ownerName || '',
              email: result.data.email || '',
              logoUrl: result.data.logoUrl || '',
              maxElectricMeter: result.data.maxElectricMeter || 999999,
              maxWaterMeter: result.data.maxWaterMeter || 99999,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching property info:', error);
        setMessage({
          type: 'error',
          text: 'Không thể tải thông tin nhà trọ',
        });
      } finally {
        setIsFetching(false);
      }
    }

    fetchPropertyInfo();
  }, [reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/settings/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'Lưu thông tin thành công!',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Có lỗi xảy ra. Vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Error saving property info:', error);
      setMessage({
        type: 'error',
        text: 'Không thể lưu thông tin. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Thông Tin Nhà Trọ</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Cấu hình thông tin nhà trọ để hiển thị trên hóa đơn và báo cáo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tên nhà trọ */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">
              Tên nhà trọ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="VD: Nhà trọ Hòa Bình"
              className="text-base h-12"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm sm:text-base">
              Địa chỉ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
              className="text-base h-12"
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="VD: 0901234567"
              className="text-base h-12"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Tên chủ nhà */}
          <div className="space-y-2">
            <Label htmlFor="ownerName" className="text-sm sm:text-base">
              Tên chủ nhà / Người quản lý <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ownerName"
              {...register('ownerName')}
              placeholder="VD: Nguyễn Văn A"
              className="text-base h-12"
            />
            {errors.ownerName && (
              <p className="text-sm text-red-500">{errors.ownerName.message}</p>
            )}
          </div>

          {/* Email (tùy chọn) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">
              Email (tùy chọn)
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="VD: contact@example.com"
              className="text-base h-12"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Logo URL (tạm thời skip upload, sẽ làm ở Task 26) */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="text-sm sm:text-base">
              URL Logo (tùy chọn)
            </Label>
            <Input
              id="logoUrl"
              {...register('logoUrl')}
              placeholder="Sẽ hỗ trợ upload logo ở phiên bản sau"
              className="text-base h-12"
              disabled
            />
            <p className="text-sm text-gray-500">
              Tính năng upload logo sẽ được thêm vào sau (Task 26)
            </p>
          </div>

          {/* Max chỉ số đồng hồ */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Cấu hình chỉ số đồng hồ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxElectricMeter" className="text-sm sm:text-base">
                  Max chỉ số đồng hồ điện <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxElectricMeter"
                  type="number"
                  {...register('maxElectricMeter', { valueAsNumber: true })}
                  placeholder="VD: 999999"
                  className="text-base h-12"
                  min="9999"
                  max="9999999"
                />
                {errors.maxElectricMeter && (
                  <p className="text-sm text-red-500">{errors.maxElectricMeter.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Giá trị tối đa cho đồng hồ điện (mặc định: 999999 - 6 chữ số)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxWaterMeter" className="text-sm sm:text-base">
                  Max chỉ số đồng hồ nước <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxWaterMeter"
                  type="number"
                  {...register('maxWaterMeter', { valueAsNumber: true })}
                  placeholder="VD: 99999"
                  className="text-base h-12"
                  min="9999"
                  max="9999999"
                />
                {errors.maxWaterMeter && (
                  <p className="text-sm text-red-500">{errors.maxWaterMeter.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Giá trị tối đa cho đồng hồ nước (mặc định: 99999 - 5 chữ số)
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`p-4 rounded-lg text-base ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu Thông Tin'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
