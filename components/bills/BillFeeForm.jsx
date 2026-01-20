'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addBillFeeSchema, updateBillFeeSchema } from '@/lib/validations/bill';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';

/**
 * BillFeeForm - Form thêm/sửa phí phát sinh
 * Requirements: 6.22-6.25
 */
export default function BillFeeForm({ 
  open, 
  onClose, 
  billId, 
  fee, 
  onSuccess 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeTypes, setFeeTypes] = useState([]);
  const { toast } = useToast();
  const isEdit = !!fee;

  const form = useForm({
    resolver: zodResolver(isEdit ? updateBillFeeSchema : addBillFeeSchema),
    defaultValues: {
      name: '',
      amount: 0,
      feeTypeId: null,
    },
  });

  // Fetch fee types
  useEffect(() => {
    if (open) {
      fetchFeeTypes();
      if (fee) {
        form.reset({
          name: fee.name || '',
          amount: fee.amount ? Number(fee.amount) : 0,
          feeTypeId: fee.feeTypeId || null,
        });
      } else {
        form.reset({
          name: '',
          amount: 0,
          feeTypeId: null,
        });
      }
    }
  }, [open, fee]);

  const fetchFeeTypes = async () => {
    try {
      const response = await fetch('/api/settings/fee-types');
      if (response.ok) {
        const data = await response.json();
        setFeeTypes(data);
      }
    } catch (error) {
      console.error('Error fetching fee types:', error);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Đảm bảo khi tạo mới phải chọn loại phí, và tự set tên phí theo danh mục
      if (!isEdit) {
        if (!data.feeTypeId) {
          throw new Error('Vui lòng chọn loại phí trong danh mục');
        }

        const selectedFeeType = feeTypes.find((ft) => ft.id === data.feeTypeId);
        if (selectedFeeType) {
          data.name = selectedFeeType.name;
        }
      }

      let url;
      let method;

      if (isEdit) {
        url = `/api/bills/${billId}/fees/${fee.id}`;
        method = 'PUT';
      } else {
        url = `/api/bills/${billId}/fees`;
        method = 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra');
      }

      const result = await response.json();
      toast({
        title: 'Thành công',
        description: isEdit ? 'Cập nhật phí phát sinh thành công' : 'Thêm phí phát sinh thành công',
        variant: 'success',
      });
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Error submitting bill fee:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể lưu phí phát sinh',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa Phí Phát Sinh' : 'Thêm Phí Phát Sinh'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Chọn phí từ danh mục khi thêm mới, khi sửa thì chỉ hiển thị tên phí */}
            {isEdit ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Loại phí</p>
                <p className="font-medium">{fee?.name}</p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="feeTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại phí *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selected = feeTypes.find((ft) => ft.id === value);
                        if (selected) {
                          form.setValue('name', selected.name, { shouldValidate: true });
                        }
                      }}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại phí trong danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feeTypes.map((feeType) => (
                          <SelectItem key={feeType.id} value={feeType.id}>
                            {feeType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Field name dùng nội bộ để gửi API, không cần hiển thị */}
            <input type="hidden" {...form.register('name')} />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Hiển thị text format thành tiền */}
            {form.watch("amount") > 0 && (
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Số tiền hiển thị: {formatCurrency(form.watch("amount"))}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Cập nhật' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
