'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateGlobalUtilityRateSchema } from '@/lib/validations/utilityRate';
import { Loading } from '@/components/ui/loading';
import TieredPricingForm from './TieredPricingForm';
import WaterPricingToggle from './WaterPricingToggle';

export default function UtilityRatesForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [useTieredPricing, setUseTieredPricing] = useState(false);
  const [waterPricingMethod, setWaterPricingMethod] = useState('METER');
  const [tieredRates, setTieredRates] = useState([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(updateGlobalUtilityRateSchema),
    defaultValues: {
      electricityPrice: 3000,
      waterPrice: 25000,
      waterPricingMethod: 'METER',
      waterPricePerPerson: null,
      useTieredPricing: false,
    }
  });

  // Fetch current utility rates
  useEffect(() => {
    const fetchUtilityRates = async () => {
      try {
        const response = await fetch('/api/settings/utility-rates');
        if (response.ok) {
          const data = await response.json();

          // Reset form với dữ liệu từ server
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
          toast({
            title: 'Lỗi',
            description: 'Không thể tải đơn giá hiện tại',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching utility rates:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải đơn giá hiện tại',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUtilityRates();
  }, [reset, toast]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        useTieredPricing,
        waterPricingMethod,
        tieredRates: useTieredPricing ? tieredRates : [],
      };

      const response = await fetch('/api/settings/utility-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật đơn giá chung',
          variant: 'success',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Lỗi',
          description: errorData.error || 'Không thể cập nhật đơn giá',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating utility rates:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật đơn giá',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đơn Giá Điện Nước Chung</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="Đang tải cấu hình đơn giá..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Đơn Giá Điện Nước Chung</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Cấu hình đơn giá mặc định cho tất cả phòng. Có thể thiết lập đơn giá riêng cho từng phòng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Giá điện */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="useTieredPricing"
                  checked={useTieredPricing}
                  onChange={(e) => {
                    setUseTieredPricing(e.target.checked);
                    setValue('useTieredPricing', e.target.checked);
                  }}
                  className="h-4 w-4 mt-1 shrink-0"
                />
                <Label htmlFor="useTieredPricing" className="text-sm sm:text-base wrap-break-word">
                  Sử dụng bậc thang giá điện (như điện nhà nước)
                </Label>
              </div>

              {!useTieredPricing ? (
                <div>
                  <Label htmlFor="electricityPrice" className="text-sm sm:text-base">Giá điện cố định (VNĐ/kWh)</Label>
                  <Input
                    id="electricityPrice"
                    type="number"
                    step="100"
                    min="0"
                    {...register('electricityPrice', { valueAsNumber: true })}
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
                  onTieredRatesChange={setTieredRates}
                />
              )}
            </div>

            {/* Phương thức tính nước */}
            <WaterPricingToggle
              waterPricingMethod={waterPricingMethod}
              onMethodChange={setWaterPricingMethod}
              register={register}
              errors={errors}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Đang lưu...' : 'Lưu Đơn Giá Chung'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}