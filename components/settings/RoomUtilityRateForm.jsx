'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateRoomUtilityRateSchema } from '@/lib/validations/utilityRate';
import { formatCurrency } from '@/lib/format';
import TieredPricingForm from './TieredPricingForm';
import WaterPricingToggle from './WaterPricingToggle';
import { Loading } from '@/components/ui/loading';
import { Zap, Droplets, Trash2 } from 'lucide-react';

export default function RoomUtilityRateForm({ room, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [useTieredPricing, setUseTieredPricing] = useState(false);
  const [waterPricingMethod, setWaterPricingMethod] = useState('METER');
  const [tieredRates, setTieredRates] = useState([]);
  const [hasCustomRates, setHasCustomRates] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isValid },
    reset
  } = useForm({
    // Tắt validation client-side, chỉ validate khi submit
    // resolver: zodResolver(updateRoomUtilityRateSchema),
    mode: 'onSubmit',
    defaultValues: {
      electricityPrice: 3000,
      waterPrice: 25000,
      waterPricingMethod: 'METER',
      waterPricePerPerson: null,
      useTieredPricing: false,
    }
  });

  // Fetch room's custom utility rates
  useEffect(() => {
    if (!isOpen || !room) return;

    const fetchRoomUtilityRates = async () => {
      setInitialLoading(true);
      try {
        const response = await fetch(`/api/rooms/${room.id}/utility-rates`);

        if (response.ok) {
          const data = await response.json();

          if (data) {
            // Phòng có đơn giá riêng
            setHasCustomRates(true);
            reset({
              electricityPrice: data.electricityPrice || 3000,
              waterPrice: data.waterPrice || 25000,
              waterPricingMethod: data.waterPricingMethod || 'METER',
              waterPricePerPerson: data.waterPricePerPerson,
              useTieredPricing: data.useTieredPricing || false,
            });
            setUseTieredPricing(data.useTieredPricing || false);
            setWaterPricingMethod(data.waterPricingMethod || 'METER');
            setTieredRates(data.tieredRates || []);
          } else {
            // Phòng chưa có đơn giá riêng, load đơn giá chung làm mặc định
            setHasCustomRates(false);
            const globalResponse = await fetch('/api/settings/utility-rates');
            if (globalResponse.ok) {
              const globalData = await globalResponse.json();
              reset({
                electricityPrice: globalData.electricityPrice || 3000,
                waterPrice: globalData.waterPrice || 25000,
                waterPricingMethod: globalData.waterPricingMethod || 'METER',
                waterPricePerPerson: globalData.waterPricePerPerson,
                useTieredPricing: globalData.useTieredPricing || false,
              });
              setUseTieredPricing(globalData.useTieredPricing || false);
              setWaterPricingMethod(globalData.waterPricingMethod || 'METER');
              setTieredRates(globalData.tieredRates || []);
            }
          }
        } else {
          toast({
            title: 'Lỗi',
            description: 'Không thể tải đơn giá của phòng',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching room utility rates:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải đơn giá của phòng',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchRoomUtilityRates();
  }, [isOpen, room, reset, toast]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Validate dữ liệu trước khi gửi
      const submitData = {
        electricityPrice: data.electricityPrice ? Number(data.electricityPrice) : null,
        waterPrice: data.waterPrice ? Number(data.waterPrice) : null,
        waterPricingMethod,
        waterPricePerPerson: data.waterPricePerPerson ? Number(data.waterPricePerPerson) : null,
        useTieredPricing,
        tieredRates: useTieredPricing ? tieredRates : [],
      };

      // Validate với Zod trước khi gửi API
      const validatedData = updateRoomUtilityRateSchema.parse(submitData);

      const response = await fetch(`/api/rooms/${room.id}/utility-rates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        setHasCustomRates(true);
        toast({
          title: 'Thành công',
          description: `Đã cập nhật đơn giá riêng cho ${room.name}`,
          variant: 'success',
        });
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Lỗi',
          description: errorData.error || 'Không thể cập nhật đơn giá',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating room utility rates:', error);

      if (error.name === 'ZodError') {
        toast({
          title: 'Lỗi dữ liệu',
          description: 'Vui lòng kiểm tra lại thông tin đã nhập',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể cập nhật đơn giá',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomRates = async () => {
    if (!hasCustomRates) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/utility-rates`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHasCustomRates(false);
        toast({
          title: 'Thành công',
          description: `${room.name} sẽ sử dụng đơn giá chung`,
          variant: 'success',
        });
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Lỗi',
          description: errorData.error || 'Không thể xóa đơn giá riêng',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting room utility rates:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa đơn giá riêng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Đơn Giá Riêng - {room.name}</span>
          </DialogTitle>
          <DialogDescription>
            {hasCustomRates
              ? 'Phòng này đang sử dụng đơn giá riêng. Bạn có thể chỉnh sửa hoặc xóa để dùng đơn giá chung.'
              : 'Phòng này đang sử dụng đơn giá chung. Thiết lập đơn giá riêng để áp dụng giá khác biệt.'
            }
          </DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <Loading text="Đang tải thông tin đơn giá..." />
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Giá điện */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`useTieredPricing-${room?.id}`}
                    checked={useTieredPricing}
                    onChange={(e) => {
                      setUseTieredPricing(e.target.checked);
                      setValue('useTieredPricing', e.target.checked, { shouldDirty: true });
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`useTieredPricing-${room?.id}`}>
                    Sử dụng bậc thang giá điện
                  </Label>
                </div>

                {!useTieredPricing ? (
                  <div>
                    <Label htmlFor={`electricityPrice-${room?.id}`}>Giá điện cố định (VNĐ/kWh)</Label>
                    <Input
                      id={`electricityPrice-${room?.id}`}
                      type="number"
                      step="100"
                      min="0"
                      {...register('electricityPrice', {
                        valueAsNumber: true,
                        onChange: () => setValue('electricityPrice', undefined, { shouldDirty: true })
                      })}
                      className="mt-1"
                    />
                    {errors.electricityPrice && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.electricityPrice.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <TieredPricingForm
                    tieredRates={tieredRates}
                    onTieredRatesChange={(rates) => {
                      setTieredRates(rates);
                      setValue('tieredRates', rates, { shouldDirty: true });
                    }}
                  />
                )}
              </div>

              {/* Phương thức tính nước */}
              <WaterPricingToggle
                waterPricingMethod={waterPricingMethod}
                onMethodChange={(method) => {
                  setWaterPricingMethod(method);
                  setValue('waterPricingMethod', method, { shouldDirty: true });
                }}
                register={register}
                errors={errors}
                roomId={room?.id}
              />

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Đang lưu...' : (hasCustomRates ? 'Cập Nhật Đơn Giá Riêng' : 'Thiết Lập Đơn Giá Riêng')}
                </Button>

                {hasCustomRates && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteCustomRates}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa & Dùng Chung</span>
                  </Button>
                )}
              </div>
            </form>

            {/* Thông tin hiện tại */}
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-sm">Trạng Thái Hiện Tại</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>Loại đơn giá:</span>
                  <span className={hasCustomRates ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                    {hasCustomRates ? 'Đơn giá riêng' : 'Đơn giá chung'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mã phòng:</span>
                  <span className="font-medium dark:text-gray-400">{room.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Giá phòng:</span>
                  <span className="font-medium dark:text-gray-400">{formatCurrency(room.price)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}