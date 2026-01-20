'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBillSchema, updateBillSchema } from '@/lib/validations/bill';
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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * BillForm - Form tạo/sửa hóa đơn
 * Requirements: 6.1-6.34
 */
export default function BillForm({ open, onClose, bill, onSuccess, roomId: initialRoomId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [lastBill, setLastBill] = useState(null);
  const { toast } = useToast();
  const isEdit = !!bill;

  const form = useForm({
    resolver: zodResolver(isEdit ? updateBillSchema.omit({ id: true }) : createBillSchema),
    defaultValues: {
      roomId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      oldElectricReading: 0,
      newElectricReading: 0,
      oldWaterReading: 0,
      newWaterReading: 0,
      electricMeterPhotoUrl: null,
      waterMeterPhotoUrl: null,
      notes: null,
    },
  });

  // Fetch rooms
  useEffect(() => {
    if (open) {
      fetchRooms();
    }
  }, [open]);

  // Fetch last bill when room changes
  useEffect(() => {
    const roomId = form.watch('roomId');
    if (roomId && !isEdit) {
      fetchLastBill(roomId);
    }
  }, [form.watch('roomId'), isEdit]);

  // Reset form when bill changes
  useEffect(() => {
    if (bill) {
      form.reset({
        roomId: bill.roomId,
        month: bill.month,
        year: bill.year,
        oldElectricReading: bill.oldElectricReading,
        newElectricReading: bill.newElectricReading,
        oldWaterReading: bill.oldWaterReading,
        newWaterReading: bill.newWaterReading,
        electricMeterPhotoUrl: bill.electricMeterPhotoUrl,
        waterMeterPhotoUrl: bill.waterMeterPhotoUrl,
        notes: bill.notes,
      });
      fetchRoom(bill.roomId);
    } else if (initialRoomId) {
      form.reset({
        roomId: initialRoomId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        oldElectricReading: 0,
        newElectricReading: 0,
        oldWaterReading: 0,
        newWaterReading: 0,
        electricMeterPhotoUrl: null,
        waterMeterPhotoUrl: null,
        notes: null,
      });
      fetchRoom(initialRoomId);
    } else {
      form.reset({
        roomId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        oldElectricReading: 0,
        newElectricReading: 0,
        oldWaterReading: 0,
        newWaterReading: 0,
        electricMeterPhotoUrl: null,
        waterMeterPhotoUrl: null,
        notes: null,
      });
    }
  }, [bill, initialRoomId, form]);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data.filter(room => room.status === 'OCCUPIED')); // Chỉ hiển thị phòng đã thuê
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách phòng',
        variant: 'destructive',
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchRoom = async (roomId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) throw new Error('Failed to fetch room');
      const data = await response.json();
      setSelectedRoom(data);
    } catch (error) {
      console.error('Error fetching room:', error);
    }
  };

  const fetchLastBill = async (roomId) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Tìm hóa đơn tháng trước
      let month = currentMonth - 1;
      let year = currentYear;
      if (month === 0) {
        month = 12;
        year = year - 1;
      }

      const response = await fetch(`/api/bills?roomId=${roomId}&month=${month}&year=${year}`);
      if (!response.ok) throw new Error('Failed to fetch last bill');
      const data = await response.json();
      
      if (data.length > 0) {
        const last = data[0];
        setLastBill(last);
        // Auto-fill chỉ số cũ từ hóa đơn trước
        form.setValue('oldElectricReading', last.newElectricReading);
        form.setValue('oldWaterReading', last.newWaterReading);
      } else {
        setLastBill(null);
        form.setValue('oldElectricReading', 0);
        form.setValue('oldWaterReading', 0);
      }
    } catch (error) {
      console.error('Error fetching last bill:', error);
      setLastBill(null);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/bills/${bill.id}` : '/api/bills';
      const method = isEdit ? 'PUT' : 'POST';

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
        description: isEdit ? 'Cập nhật hóa đơn thành công' : 'Tạo hóa đơn thành công',
        variant: 'success',
      });
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Error submitting bill:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tạo hóa đơn',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMonth = form.watch('month');
  const currentYear = form.watch('year');
  const roomId = form.watch('roomId');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa Hóa Đơn' : 'Tạo Hóa Đơn Mới'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phòng *</FormLabel>
                  <Select
                    disabled={isEdit || loadingRooms}
                    onValueChange={(value) => {
                      field.onChange(value);
                      fetchRoom(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.code} - {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tháng *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2000"
                        max="2100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedRoom && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p><strong>Phòng:</strong> {selectedRoom.code} - {selectedRoom.name}</p>
                <p><strong>Giá phòng:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedRoom.price)}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-medium">Chỉ số đồng hồ điện</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="oldElectricReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chỉ số cũ *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      {lastBill && (
                        <FormDescription>
                          Từ hóa đơn {lastBill.month}/{lastBill.year}: {lastBill.newElectricReading}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newElectricReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chỉ số mới *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Chỉ số đồng hồ nước</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="oldWaterReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chỉ số cũ *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      {lastBill && (
                        <FormDescription>
                          Từ hóa đơn {lastBill.month}/{lastBill.year}: {lastBill.newWaterReading}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newWaterReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chỉ số mới *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Ghi chú (tùy chọn)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Cập nhật' : 'Tạo hóa đơn'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
