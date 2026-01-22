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
  Trash2,
  Clock
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');

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

  const handleUpdateStatus = async (isPaid, paidAmountValue = null) => {
    try {
      setIsUpdatingStatus(true);
      const response = await fetch(`/api/bills/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPaid,
          paidAmount: paidAmountValue !== null ? Number(paidAmountValue) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
      
      toast({
        title: 'Thành công',
        description: isPaid 
          ? (paidAmountValue && Number(paidAmountValue) < Number(bill.totalCost)
              ? `Đã ghi nhận thanh toán ${formatCurrency(paidAmountValue)}`
              : 'Đã đánh dấu thanh toán đầy đủ')
          : 'Đã hủy thanh toán',
        variant: 'success',
      });
      
      setIsPaymentDialogOpen(false);
      setPaidAmount('');
      fetchBill();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenPaymentDialog = () => {
    if (bill.isPaid && bill.paidAmount) {
      setPaidAmount(bill.paidAmount.toString());
    } else {
      setPaidAmount(bill.totalCost.toString());
    }
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    const amount = paidAmount ? Number(paidAmount) : Number(bill.totalCost);
    if (amount < 0) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền không được âm',
        variant: 'destructive',
      });
      return;
    }
    if (amount > Number(bill.totalCost)) {
      toast({
        title: 'Lỗi',
        description: `Số tiền không được vượt quá tổng tiền hóa đơn (${formatCurrency(bill.totalCost)})`,
        variant: 'destructive',
      });
      return;
    }
    handleUpdateStatus(true, amount);
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

      {/* Thông tin cơ bản - Layout 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bên trái: Thông tin người thuê và thông tin hóa đơn */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin người thuê */}
          {bill.tenantName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Thông Tin Người Thuê
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Họ và tên</p>
                    <p className="font-medium">{bill.tenantName}</p>
                  </div>
                  {bill.tenantPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Số điện thoại</p>
                      <p className="font-medium">{bill.tenantPhone}</p>
                    </div>
                  )}
                  {bill.tenantDateOfBirth && bill.tenantDateOfBirth !== '' ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày sinh</p>
                      <p className="font-medium">{formatDate(bill.tenantDateOfBirth)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày sinh</p>
                      <p className="font-medium">Chưa có</p>
                    </div>
                  )}
                  {bill.tenantIdCard && bill.tenantIdCard !== '' ? (
                    <div>
                      <p className="text-sm text-muted-foreground">CMND/CCCD</p>
                      <p className="font-medium">{bill.tenantIdCard}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">CMND/CCCD</p>
                      <p className="font-medium">Chưa có</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thông tin hóa đơn */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Hóa Đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col">
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
                  {(() => {
                    const totalCost = Number(bill.totalCost || 0);
                    const paidAmount = bill.paidAmount ? Number(bill.paidAmount) : 0;
                    const isPartiallyPaid = bill.isPaid && paidAmount > 0 && paidAmount < totalCost;
                    
                    if (isPartiallyPaid) {
                      return (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">
                          <Clock className="h-3 w-3 mr-1" />
                          Thanh toán một phần
                        </Badge>
                      );
                    } else if (bill.isPaid) {
                      return (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Đã thanh toán
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
                          <XCircle className="h-3 w-3 mr-1" />
                          Chưa thanh toán
                        </Badge>
                      );
                    }
                  })()}
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
        </div>

        {/* Bên phải: Tổng tiền */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Tổng Tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col flex-1">
            <div>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(bill.totalCost)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {bill.totalCostText}
              </p>
            </div>

            {/* Hiển thị thông tin thanh toán */}
            {bill.isPaid && bill.paidAmount && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã thanh toán:</span>
                  <span className="font-medium">{formatCurrency(bill.paidAmount)}</span>
                </div>
                {Number(bill.paidAmount) < Number(bill.totalCost) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Còn thiếu:</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(Number(bill.totalCost) - Number(bill.paidAmount))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="mt-auto">
            {!bill.isPaid && (
              <Button
                className="w-full"
                onClick={handleOpenPaymentDialog}
                disabled={isUpdatingStatus}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Đánh Dấu Đã Thanh Toán
              </Button>
            )}

            {bill.isPaid && (
              <>
                <Button
                  variant="outline"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  onClick={handleOpenPaymentDialog}
                  disabled={isUpdatingStatus}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Cập Nhật Thanh Toán
                </Button>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
                  onClick={() => handleUpdateStatus(false)}
                  disabled={isUpdatingStatus}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Hủy Thanh Toán
                </Button>
              </>
            )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chi tiết tính toán */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Điện */}
        <Card className="bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
          <CardHeader className="bg-amber-100/40 dark:bg-amber-900/20">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              <span className="text-amber-600 dark:text-amber-400">Điện</span>
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
        <Card className="bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
          <CardHeader className="bg-blue-100/40 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400">Nước</span>
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

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập Số Tiền Đã Thanh Toán</DialogTitle>
            <DialogDescription>
              Nhập số tiền đã thanh toán. Để trống hoặc nhập bằng tổng tiền để đánh dấu thanh toán đầy đủ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="totalCost">Tổng tiền hóa đơn</Label>
              <Input
                id="totalCost"
                value={formatCurrency(bill?.totalCost || 0)}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="paidAmount">Số tiền đã thanh toán (VNĐ)</Label>
              <Input
                id="paidAmount"
                type="number"
                min="0"
                max={bill?.totalCost || 0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={bill?.totalCost?.toString() || '0'}
                className="mt-1"
              />
              {/* Hiển thị text format thành tiền */}
              {paidAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Số tiền hiển thị: {formatCurrency(paidAmount)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Để trống hoặc nhập {formatCurrency(bill?.totalCost || 0)} để thanh toán đầy đủ
              </p>
            </div>
            {paidAmount && Number(paidAmount) < Number(bill?.totalCost || 0) && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  Còn thiếu: {formatCurrency(Number(bill?.totalCost || 0) - Number(paidAmount))}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Hóa đơn sẽ được đánh dấu là đã thanh toán một phần và phần còn thiếu sẽ được tính vào nợ.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false);
                setPaidAmount('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
