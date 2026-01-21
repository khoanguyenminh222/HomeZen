'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Zap,
  Droplets,
  Home,
  Calendar,
  DollarSign,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import BillForm from '@/components/bills/BillForm';
import BillFeeList from '@/components/bills/BillFeeList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Trang chi tiết hóa đơn
 * Requirements: 6.32
 */
export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchBill();
    }
  }, [params.id]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bills/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch bill');
      const data = await response.json();
      setBill(data);
    } catch (error) {
      console.error('Error fetching bill:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin hóa đơn',
        variant: 'destructive',
      });
      router.push('/bills');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (isPaid) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/bills/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      toast({
        title: 'Thành công',
        description: isPaid ? 'Đã đánh dấu thanh toán' : 'Đã hủy thanh toán',
        variant: 'success',
      });
      
      fetchBill();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFormSuccess = () => {
    fetchBill();
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/bills/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bill');
      }

      toast({
        title: 'Thành công',
        description: 'Đã xóa hóa đơn',
        variant: 'success',
      });

      router.push('/bills');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa hóa đơn',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!bill) {
    return (
      <div className="container mx-auto p-4">
        <p>Không tìm thấy hóa đơn</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/bills')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              Chi Tiết Hóa Đơn
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
              {bill.room?.code} - Tháng {bill.month}/{bill.year}
            </p>
          </div>
        </div>
        {!bill.isPaid && (
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsFormOpen(true)}
              disabled={isUpdatingStatus || isDeleting}
              className="min-w-[140px] justify-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Sửa Hóa Đơn
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
              if (!isDeleting) {
                setIsDeleteDialogOpen(open);
              }
            }}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={isUpdatingStatus || isDeleting}
                  className="min-w-[140px] justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Hóa Đơn
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent 
                onOverlayClick={() => {
                  if (!isDeleting) {
                    setIsDeleteDialogOpen(false);
                  }
                }}
                onInteractOutside={(e) => {
                  if (!isDeleting) {
                    setIsDeleteDialogOpen(false);
                  } else {
                    e.preventDefault();
                  }
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa hóa đơn</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa hóa đơn này không? Hành động này không thể hoàn tác.
                    <br />
                    <span className="font-medium mt-2 block">
                      Phòng: {bill.room?.code} - Tháng {bill.month}/{bill.year}
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông Tin Hóa Đơn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phòng</p>
                <p className="font-medium">{bill.room?.code} - {bill.room?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tháng/Năm</p>
                <p className="font-medium">{bill.month}/{bill.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                {bill.isPaid ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Đã thanh toán
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                    <XCircle className="h-3 w-3 mr-1" />
                    Chưa thanh toán
                  </Badge>
                )}
              </div>
              {bill.paidDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Ngày thanh toán</p>
                  <p className="font-medium">{formatDate(bill.paidDate)}</p>
                </div>
              )}
            </div>

            {(bill.electricityRollover || bill.waterRollover) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start sm:items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Cảnh báo: Đồng hồ xoay vòng
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-200">
                    {bill.electricityRollover && 'Điện '}
                    {bill.electricityRollover && bill.waterRollover && 'và '}
                    {bill.waterRollover && 'Nước'}
                  </p>
                </div>
              </div>
            )}

            {bill.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Ghi chú</p>
                <p className="font-medium">{bill.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tổng tiền */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng Tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(bill.totalCost)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {bill.totalCostText}
              </p>
            </div>

            {!bill.isPaid && (
              <Button
                className="w-full"
                onClick={() => handleUpdateStatus(true)}
                disabled={isUpdatingStatus}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Đánh Dấu Đã Thanh Toán
              </Button>
            )}

            {bill.isPaid && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpdateStatus(false)}
                disabled={isUpdatingStatus}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Hủy Thanh Toán
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chi tiết tính toán */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Điện */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Điện
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Chỉ số cũ</p>
                <p className="font-medium">{bill.oldElectricReading}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chỉ số mới</p>
                <p className="font-medium">{bill.newElectricReading}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiêu thụ</p>
                <p className="font-medium">{bill.electricityUsage} kWh</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thành tiền</p>
                <p className="font-medium text-lg">
                  {formatCurrency(bill.electricityCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nước */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Nước
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Chỉ số cũ</p>
                <p className="font-medium">{bill.oldWaterReading}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chỉ số mới</p>
                <p className="font-medium">{bill.newWaterReading}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiêu thụ</p>
                <p className="font-medium">{bill.waterUsage} m³</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thành tiền</p>
                <p className="font-medium text-lg">
                  {formatCurrency(bill.waterCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phí phát sinh */}
      <BillFeeList
        billId={bill.id}
        fees={bill.billFees || []}
        isPaid={bill.isPaid}
        onUpdate={fetchBill}
      />

      {/* Chi tiết tổng hợp */}
      <Card>
        <CardHeader>
          <CardTitle>Chi Tiết Tổng Hợp</CardTitle>
        </CardHeader>
          <CardContent>
          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Tiền phòng</span>
              <span className="font-medium">{formatCurrency(bill.roomPrice)}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Tiền điện</span>
              <span className="font-medium">{formatCurrency(bill.electricityCost)}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Tiền nước</span>
              <span className="font-medium">{formatCurrency(bill.waterCost)}</span>
            </div>
            {bill.billFees && bill.billFees.length > 0 && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">Phí phụ thu</span>
                <span className="font-medium">
                  {formatCurrency(
                    bill.billFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0)
                  )}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pt-3 border-t text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatCurrency(bill.totalCost)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <BillForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        bill={bill}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
