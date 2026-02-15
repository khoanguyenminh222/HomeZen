'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Home,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import TenantForm from '@/components/tenants/TenantForm';
import OccupantForm from '@/components/tenants/OccupantForm';
import DepositReturnForm from '@/components/tenants/DepositReturnForm';
import SoftDeleteDialog from '@/components/tenants/SoftDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { Loading } from '@/components/ui/loading';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debtInfo, setDebtInfo] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOccupantDialogOpen, setIsOccupantDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isSoftDeleteDialogOpen, setIsSoftDeleteDialogOpen] = useState(false);
  const [editingOccupant, setEditingOccupant] = useState(null);
  const [deleteOccupantDialogOpen, setDeleteOccupantDialogOpen] = useState({});

  // Fetch tenant details
  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenants/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Lỗi',
            description: 'Không tìm thấy người thuê',
            variant: 'destructive'
          });
          router.push('/tenants');
          return;
        }
        throw new Error('Failed to fetch tenant');
      }

      const data = await response.json();
      setTenant(data);

      // Fetch debt info if tenant has a room
      if (data.phong_id) {
        try {
          const debtResponse = await fetch(`/api/rooms/${data.phong_id}/debt`);
          if (debtResponse.ok) {
            const debtData = await debtResponse.json();
            setDebtInfo(debtData);
          }
        } catch (error) {
          console.error('Error fetching debt info:', error);
        }
      } else {
        setDebtInfo(null);
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin người thuê',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTenant();
    }
  }, [params.id]);

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchTenant();
    toast({
      title: 'Thành công',
      description: 'Đã cập nhật thông tin người thuê',
      variant: 'success'
    });
  };

  // Handle occupant success
  const handleOccupantSuccess = () => {
    setIsOccupantDialogOpen(false);
    setEditingOccupant(null);
    fetchTenant();
    toast({
      title: 'Thành công',
      description: editingOccupant ? 'Đã cập nhật thông tin người ở' : 'Đã thêm người ở mới',
      variant: 'success'
    });
  };

  // Handle delete occupant
  const handleDeleteOccupant = async (occupantId) => {
    try {
      const response = await fetch(`/api/tenants/${params.id}/occupants/${occupantId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete occupant');
      }

      fetchTenant();
      toast({
        title: 'Thành công',
        description: 'Đã xóa người ở',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error deleting occupant:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa người ở',
        variant: 'destructive'
      });
    }
  };

  // Handle return room (Checkout)
  const handleReturnRoom = async (depositReturnData) => {
    try {
      const response = await fetch(`/api/tenants/${params.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          depositReturn: depositReturnData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'Không thể trả phòng khi còn nợ') {
          toast({
            title: 'Không thể trả phòng',
            description: errorData.message || `Phòng này còn nợ ${formatCurrency(errorData.debtAmount || 0)}. Vui lòng thanh toán hết nợ trước khi trả phòng.`,
            variant: 'destructive'
          });
          // Refresh debt info
          if (tenant?.phong_id) {
            const debtResponse = await fetch(`/api/rooms/${tenant.phong_id}/debt`);
            if (debtResponse.ok) {
              const debtData = await debtResponse.json();
              setDebtInfo(debtData);
            }
          }
          return;
        }
        throw new Error(errorData.error || 'Failed to return room');
      }

      toast({
        title: 'Thành công',
        description: 'Đã trả phòng thành công. Thông tin người thuê vẫn được lưu lại.',
        variant: 'success'
      });

      fetchTenant();
      setIsReturnDialogOpen(false);
    } catch (error) {
      console.error('Error returning room:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể trả phòng',
        variant: 'destructive'
      });
    }
  };

  // Handle soft delete
  const handleDeleteTenant = async (reason) => {
    try {
      const response = await fetch(`/api/tenants/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to delete tenant');
      }

      toast({
        title: 'Thành công',
        description: 'Hồ sơ đã được chuyển vào danh sách đã xóa',
        variant: 'success'
      });

      router.push('/tenants');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa người thuê',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <Loading text="Đang tải thông tin người thuê..." />;
  }

  if (!tenant) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Không tìm thấy thông tin người thuê</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/tenants')} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold wrap-break-word">{tenant.ho_ten}</h1>
            {tenant.phong ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-none w-fit">Đang thuê</Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none w-fit">Chưa thuê</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">Chi tiết người thuê</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900 dark:hover:text-amber-300">
                    <Edit className="h-4 w-4 mr-2" />
                    Sửa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle>Sửa thông tin người thuê</DialogTitle>
                  </DialogHeader>
                  <TenantForm
                    initialData={tenant}
                    isEdit={true}
                    onSuccess={handleEditSuccess}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{tenant.dien_thoai}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CMND/CCCD</p>
                    <p className="font-medium">{tenant.can_cuoc || 'Chưa có'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày sinh</p>
                    <p className="font-medium">{formatDate(tenant.ngay_sinh)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quê quán</p>
                    <p className="font-medium">{tenant.que_quan || 'Chưa có'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Occupants */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                <span className="wrap-break-word">Danh sách người ở ({tenant.nguoi_o?.length || 0} người)</span>
              </CardTitle>
              <Dialog
                open={isOccupantDialogOpen}
                onOpenChange={(open) => {
                  setIsOccupantDialogOpen(open);
                  if (!open) {
                    // Reset editingOccupant when dialog closes
                    setEditingOccupant(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm người ở
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOccupant ? 'Sửa thông tin người ở' : 'Thêm người ở mới'}
                    </DialogTitle>
                  </DialogHeader>
                  <OccupantForm
                    tenantId={tenant.id}
                    initialData={editingOccupant}
                    isEdit={!!editingOccupant}
                    onSuccess={handleOccupantSuccess}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tenant.nguoi_o?.length > 0 ? (
                <div className="space-y-3">
                  {tenant.nguoi_o.map((occupant) => (
                    <div key={occupant.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium wrap-break-word">{occupant.ho_ten}</p>
                          <Badge variant={occupant.loai_cu_tru === 'THUONG_TRU' ? 'default' : 'secondary'} className="w-fit">
                            {occupant.loai_cu_tru === 'THUONG_TRU' ? 'Thường trú' : 'Tạm trú'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {occupant.moi_quan_he && <p>Quan hệ: {occupant.moi_quan_he}</p>}
                          {occupant.can_cuoc && <p>CMND/CCCD: {occupant.can_cuoc}</p>}
                          {occupant.ngay_sinh && <p>Ngày sinh: {formatDate(occupant.ngay_sinh)}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => {
                            setEditingOccupant(occupant);
                            setIsOccupantDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 sm:mr-0" />
                          <span className="sm:hidden ml-1">Sửa</span>
                        </Button>
                        <AlertDialog
                          open={deleteOccupantDialogOpen[occupant.id] || false}
                          onOpenChange={(open) => {
                            setDeleteOccupantDialogOpen(prev => ({
                              ...prev,
                              [occupant.id]: open
                            }));
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300">
                              <Trash2 className="h-3 w-3 sm:mr-0" />
                              <span className="sm:hidden ml-1">Xóa</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            onOverlayClick={() => {
                              setDeleteOccupantDialogOpen(prev => ({
                                ...prev,
                                [occupant.id]: false
                              }));
                            }}
                            onInteractOutside={(e) => {
                              setDeleteOccupantDialogOpen(prev => ({
                                ...prev,
                                [occupant.id]: false
                              }));
                            }}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa người ở &ldquo;{occupant.ho_ten}&rdquo;?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">Hủy</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => {
                                handleDeleteOccupant(occupant.id);
                                setDeleteOccupantDialogOpen(prev => ({
                                  ...prev,
                                  [occupant.id]: false
                                }));
                              }}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Chưa có người ở nào
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Room Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Home className="h-5 w-5" />
                Thông tin phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Mã phòng</p>
                <p className="font-semibold text-lg">{tenant.phong?.ma_phong}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tên phòng</p>
                <p className="font-medium">{tenant.phong?.ten_phong}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá phòng</p>
                <p className="font-medium">{formatCurrency(tenant.phong?.gia_phong)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày vào ở</p>
                <p className="font-medium">{formatDate(tenant.ngay_vao_o)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <DollarSign className="h-5 w-5" />
                Tiền cọc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Số tiền cọc</p>
                <p className="font-semibold text-lg">{formatCurrency(tenant.tien_coc)}</p>
              </div>

              {tenant.hoan_tra_coc?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Lịch sử hoàn trả</p>
                  <div className="space-y-2">
                    {tenant.hoan_tra_coc.map((dr) => (
                      <div key={dr.id} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">{formatCurrency(dr.so_tien)}</p>
                        <p className="text-muted-foreground">
                          {formatDate(dr.ngay_hoan_tra)} - {dr.phuong_thuc === 'HOAN_TRA_DAY_DU' ? 'Hoàn trả đầy đủ' : 'Trừ vào hóa đơn cuối'}
                        </p>
                        {dr.ghi_chu && <p className="text-muted-foreground">{dr.ghi_chu}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {tenant.url_hop_dong && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FileText className="h-5 w-5" />
                  Hợp đồng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(tenant.url_hop_dong, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Xem hợp đồng
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenant.phong ? (
                <>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm"
                    onClick={() => router.push(`/bills/create?roomId=${tenant.phong?.id}`)}
                  >
                    Tạo hóa đơn
                  </Button>

                  {debtInfo && debtInfo.totalDebt > 0 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg mb-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                            Phòng còn nợ: {formatCurrency(debtInfo.totalDebt)}
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Bạn có thể chọn &ldquo;Trừ vào hóa đơn cuối&rdquo; để dùng tiền cọc thanh toán nợ.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Trả phòng
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>Trả phòng</DialogTitle>
                      </DialogHeader>
                      <DepositReturnForm
                        tenant={tenant}
                        debtInfo={debtInfo}
                        onConfirm={handleReturnRoom}
                        onCancel={() => setIsReturnDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>

                  <p className="text-xs text-center text-muted-foreground pt-2 italic">
                    * Cần trả phòng trước khi xóa hồ sơ vĩnh viễn
                  </p>
                </>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsSoftDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa hồ sơ
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <SoftDeleteDialog
        tenant={tenant}
        isOpen={isSoftDeleteDialogOpen}
        onOpenChange={setIsSoftDeleteDialogOpen}
        onConfirm={handleDeleteTenant}
      />
    </div>
  );
}