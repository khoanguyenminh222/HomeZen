'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoomFeeSchema, updateRoomFeeSchema } from '@/lib/validations/roomFee';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format';

/**
 * RoomFeeForm - Form gán/sửa phí cho phòng
 * Requirements: 6.22-6.24
 */
export default function RoomFeeForm({ open, onClose, roomId, roomFee, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeTypes, setFeeTypes] = useState([]);
  const { toast } = useToast();
  const isEdit = !!roomFee;

  const form = useForm({
    resolver: zodResolver(isEdit ? updateRoomFeeSchema : createRoomFeeSchema),
    defaultValues: {
      feeTypeId: '',
      amount: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      fetchFeeTypes();
      if (roomFee) {
        form.reset({
          amount: roomFee.amount ? Number(roomFee.amount) : 0,
          isActive: roomFee.isActive ?? true,
        });
      } else {
        form.reset({
          feeTypeId: '',
          amount: 0,
          isActive: true,
        });
      }
    }
  }, [open, roomFee]);

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
      let url;
      let method;

      if (isEdit) {
        url = `/api/rooms/${roomId}/fees/${roomFee.id}`;
        method = 'PUT';
      } else {
        url = `/api/rooms/${roomId}/fees`;
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
        description: isEdit ? 'Cập nhật phí của phòng thành công' : 'Gán phí cho phòng thành công',
        variant: 'success',
      });
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Error submitting room fee:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể lưu phí của phòng',
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
          <DialogTitle>{isEdit ? 'Sửa Phí Của Phòng' : 'Gán Phí Cho Phòng'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name="feeTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại phí *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại phí" />
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Kích hoạt</FormLabel>
                    <FormDescription>
                      Phí này sẽ được tự động thêm vào hóa đơn
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Cập nhật' : 'Gán phí'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
