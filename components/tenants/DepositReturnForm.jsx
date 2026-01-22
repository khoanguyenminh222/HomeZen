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

export default function DepositReturnForm({ tenant, debtInfo, onConfirm, onCancel }) {
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

  // Tính toán nợ còn lại và phần dư tiền cọc sau khi trừ vào các hóa đơn còn nợ (từ mới đến cũ)
  const calculateRemainingDebt = () => {
    if (!debtInfo || debtInfo.totalDebt === 0) {
      return { remainingDebt: 0, excessDeposit: watchedAmount || 0 };
    }
    if (watchedMethod !== 'DEDUCT_FROM_LAST_BILL') {
      return { remainingDebt: debtInfo.totalDebt, excessDeposit: 0 };
    }
    
    const depositAmount = watchedAmount || 0;
    if (depositAmount === 0) {
      return { remainingDebt: debtInfo.totalDebt, excessDeposit: 0 };
    }

    // Lấy danh sách các hóa đơn còn nợ, đã được sắp xếp từ mới đến cũ
    const unpaidBills = debtInfo.unpaidBills || [];
    if (unpaidBills.length === 0) {
      return { remainingDebt: debtInfo.totalDebt, excessDeposit: depositAmount };
    }

    // Tính lại tổng nợ sau khi trừ tiền cọc vào các hóa đơn còn nợ
    let remainingDeposit = depositAmount;
    let newTotalDebt = debtInfo.totalDebt;

    // Trừ tiền cọc vào các hóa đơn còn nợ theo thứ tự từ mới đến cũ
    for (const bill of unpaidBills) {
      if (remainingDeposit <= 0) break;
      
      const billRemainingDebt = bill.remainingDebt || 0;
      if (billRemainingDebt > 0) {
        // Số tiền cọc được áp dụng vào hóa đơn này
        const appliedAmount = Math.min(remainingDeposit, billRemainingDebt);
        newTotalDebt = Math.max(0, newTotalDebt - appliedAmount);
        remainingDeposit -= appliedAmount;
      }
    }
    
    // Phần dư tiền cọc sau khi trừ vào nợ
    const excessDeposit = Math.max(0, remainingDeposit);
    
    return { remainingDebt: newTotalDebt, excessDeposit };
  };

  const { remainingDebt, excessDeposit } = calculateRemainingDebt();
  const canCheckout = remainingDebt === 0;

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
      {/* Debt Warning */}
      {debtInfo && debtInfo.totalDebt > 0 && (
        <Card className={canCheckout ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${canCheckout ? 'text-green-600' : 'text-red-600'}`} />
              <CardTitle className={`text-lg ${canCheckout ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {canCheckout ? 'Có thể trả phòng' : 'Không thể trả phòng'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={canCheckout ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
              {canCheckout ? (
                <>
                  Tổng nợ ban đầu: <strong>{formatCurrency(debtInfo.totalDebt)}</strong>. 
                  Sau khi trừ tiền cọc vào các hóa đơn còn nợ, <strong>không còn nợ</strong>.
                  {excessDeposit > 0 && (
                    <> Phần dư tiền cọc <strong>{formatCurrency(excessDeposit)}</strong> sẽ được hoàn trả.</>
                  )}
                  {' '}Có thể trả phòng.
                </>
              ) : (
                <>
                  Tổng nợ hiện tại: <strong>{formatCurrency(debtInfo.totalDebt)}</strong> (từ tất cả các hóa đơn).
                  {watchedMethod === 'DEDUCT_FROM_LAST_BILL' && watchedAmount > 0 ? (
                    <>
                      {' '}Sau khi trừ tiền cọc ({formatCurrency(watchedAmount)}) vào các hóa đơn còn nợ (từ mới đến cũ), còn nợ <strong>{formatCurrency(remainingDebt)}</strong>.
                      {excessDeposit > 0 && (
                        <> Phần dư tiền cọc <strong>{formatCurrency(excessDeposit)}</strong> sẽ được hoàn trả.</>
                      )}
                      {' '}Vui lòng thanh toán hết nợ trước khi trả phòng.
                    </>
                  ) : (
                    <> Vui lòng chọn "Trừ vào hóa đơn cuối" và đảm bảo tiền cọc đủ để thanh toán hết nợ.</>
                  )}
                </>
              )}
            </p>
            {debtInfo.unpaidBills && debtInfo.unpaidBills.length > 0 && (
              <p className={`text-sm mt-2 ${canCheckout ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                Có {debtInfo.unpaidBills.length} hóa đơn chưa thanh toán đầy đủ.
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
                  <Label htmlFor="amount">Số tiền hoàn trả (VNĐ) <span className="text-red-500">*</span></Label>
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
                  <Label htmlFor="method">Phương thức hoàn trả <span className="text-red-500">*</span></Label>
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
                      {watchedMethod === 'DEDUCT_FROM_LAST_BILL' && debtInfo && debtInfo.totalDebt > 0 && (
                        <>
                          <div className="mt-2 pt-2 border-t space-y-1">
                            <p>• Tổng nợ ban đầu (từ tất cả hóa đơn): {formatCurrency(debtInfo.totalDebt)}</p>
                            {debtInfo.unpaidBills && debtInfo.unpaidBills.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                • Có {debtInfo.unpaidBills.length} hóa đơn còn nợ. Tiền cọc sẽ được trừ vào các hóa đơn này theo thứ tự từ mới đến cũ.
                              </p>
                            )}
                            <p className={canCheckout ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              • Tổng nợ còn lại sau khi trừ tiền cọc ({formatCurrency(watchedAmount || 0)}): {formatCurrency(remainingDebt)}
                            </p>
                            {excessDeposit > 0 && (
                              <p className="text-blue-600 font-semibold">
                                • Phần dư tiền cọc sẽ được hoàn trả: {formatCurrency(excessDeposit)}
                              </p>
                            )}
                          </div>
                        </>
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
                  disabled={loading || (debtInfo && debtInfo.totalDebt > 0 && !canCheckout)}
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
                disabled={loading || (debtInfo && debtInfo.totalDebt > 0 && !canCheckout)}
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