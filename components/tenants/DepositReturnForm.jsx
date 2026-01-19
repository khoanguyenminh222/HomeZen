'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { depositReturnSchema } from '@/lib/validations/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function DepositReturnForm({ tenant, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(depositReturnSchema),
    defaultValues: {
      amount: tenant.deposit ? parseFloat(tenant.deposit) : 0,
      method: 'FULL_RETURN',
      notes: ''
    }
  });

  const watchedMethod = watch('method');
  const watchedAmount = watch('amount');

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      if (onConfirm) {
        await onConfirm(data);
      }
    } catch (error) {
      console.error('Error in deposit return:', error);
    } finally {
      setLoading(false);
    }
  };

  const depositAmount = tenant.deposit ? parseFloat(tenant.deposit) : 0;

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg text-yellow-800">
              Xác nhận trả phòng
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            Xác nhận <strong>{tenant.fullName}</strong> (Phòng {tenant.room?.code}) sẽ trả phòng.
            Hành động này sẽ xóa liên kết giữa người thuê với phòng.
          </p>
        </CardContent>
      </Card>

      {/* Deposit Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Thông tin tiền cọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Tiền cọc ban đầu:</Label>
              <p className="font-semibold">{formatCurrency(depositAmount)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Người thuê:</Label>
              <p className="font-semibold">{tenant.fullName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Return Form */}
      {depositAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hoàn trả tiền cọc</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Số tiền hoàn trả (VNĐ) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    max={depositAmount}
                    step="1000"
                    {...register('amount', { valueAsNumber: true })}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Tối đa: {formatCurrency(depositAmount)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="method">Phương thức hoàn trả *</Label>
                  <Select onValueChange={(value) => setValue('method', value)} defaultValue="FULL_RETURN">
                    <SelectTrigger className={errors.method ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_RETURN">Hoàn trả đầy đủ</SelectItem>
                      <SelectItem value="DEDUCT_FROM_LAST_BILL">Trừ vào hóa đơn cuối</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.method && (
                    <p className="text-sm text-red-500 mt-1">{errors.method.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Ghi chú về việc hoàn trả cọc (nếu có)..."
                  rows={3}
                  className={errors.notes ? 'border-red-500' : ''}
                />
                {errors.notes && (
                  <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
                )}
              </div>

              {/* Summary */}
              {watchedMethod && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Tóm tắt:</h4>
                    <div className="space-y-1 text-sm">
                      <p>• Tiền cọc ban đầu: {formatCurrency(depositAmount)}</p>
                      <p>• Số tiền hoàn trả: {formatCurrency(watchedAmount || 0)}</p>
                      <p>• Phương thức: {watchedMethod === 'FULL_RETURN' ? 'Hoàn trả đầy đủ' : 'Trừ vào hóa đơn cuối'}</p>
                      {watchedAmount < depositAmount && (
                        <p className="text-orange-600">• Số tiền giữ lại: {formatCurrency(depositAmount - (watchedAmount || 0))}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:flex-1 mt-2 sm:mt-0"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1"
                  variant="destructive"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận trả phòng'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* No deposit case */}
      {depositAmount === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Người thuê này không có tiền cọc
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:flex-1 mt-2 sm:mt-0"
              >
                Hủy
              </Button>
              <Button
                onClick={() => onConfirm(null)}
                disabled={loading}
                className="w-full sm:flex-1"
                variant="destructive"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận trả phòng'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}