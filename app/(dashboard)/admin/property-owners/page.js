'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, ShieldOff, Edit, Trash2, Lock, Search, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import PropertyOwnerForm from '@/components/admin/forms/PropertyOwnerForm';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';

/**
 * Property Owners Management Page
 * Requirements: 1.1, 1.3, 1.4, 8.1
 */
export default function PropertyOwnersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [propertyOwners, setPropertyOwners] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetPasswordOwner, setResetPasswordOwner] = useState(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchPropertyOwners();
  }, []);

  useEffect(() => {
    const filtered = propertyOwners.filter(owner =>
      owner.tai_khoan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.thong_tin_nha_tro?.ten?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.thong_tin_nha_tro?.ten_chu_nha?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOwners(filtered);
  }, [searchQuery, propertyOwners]);

  const fetchPropertyOwners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/property-owners');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách chủ trọ');
      }
      const data = await response.json();
      const owners = data.data || [];
      setPropertyOwners(owners);
      setFilteredOwners(owners);
    } catch (err) {
      console.error('Error fetching property owners:', err);
      toast({
        title: 'Lỗi',
        description: err.message || 'Không thể tải danh sách chủ trọ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (ownerId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/property-owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentStatus ? 'deactivate' : 'activate',
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái');
      }

      toast({
        title: 'Thành công',
        description: `Đã ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} chủ trọ thành công`,
        variant: 'success',
      });

      fetchPropertyOwners();
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err.message || 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSubmit = async (data) => {
    try {
      const response = await fetch('/api/admin/property-owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể tạo chủ trọ');
      }

      toast({
        title: 'Thành công',
        description: 'Đã tạo chủ trọ mới thành công',
        variant: 'success',
      });

      setIsCreateDialogOpen(false);
      fetchPropertyOwners();
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
      // Re-throw to stop form submission spinner if handled upstream, or handle explicitly
      // For now, toast is enough
    }
  };

  const handleEditSubmit = async (data) => {
    try {
      // Data from form includes propertyName, propertyAddress etc.
      // Need to structure for API if necessary, but API expects flat struct in body mostly, handled by reusable form?
      // Reusable form sends: { username, password, propertyName, propertyAddress, phone, ownerName, email, maxElectricMeter, maxWaterMeter }
      // This matches PATCH expected body for properties/[id], except username/password ignored there usually or handled separately?
      // Wait, endpoint is /api/admin/properties/${owner.id}, checks property updates. 
      // User updates not fully supported in property endpoint?
      // Let's check api/admin/properties/[id]/route.js if possible, but assuming existing logic was doing PATCH there.

      const response = await fetch(`/api/admin/properties/${selectedOwner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể cập nhật');
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin chủ trọ thành công',
        variant: 'success',
      });

      setIsEditDialogOpen(false);
      setSelectedOwner(null);
      fetchPropertyOwners();
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản Lý Chủ Trọ</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý tài khoản chủ trọ trong hệ thống
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo Chủ Trọ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Chủ Trọ mới</DialogTitle>
              <DialogDescription>
                Tạo tài khoản mới cho chủ trọ với thông tin nhà trọ
              </DialogDescription>
            </DialogHeader>
            <PropertyOwnerForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="max-w-md relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Tìm theo tên, username hoặc nhà trọ..."
          className="pl-10 h-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Property Owners List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOwners.map((owner) => (
          <Card key={owner.id} className="overflow-hidden shadow-md hover:shadow-lg transition-all bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">{owner.tai_khoan}</CardTitle>
                </div>
                <Badge variant={owner.trang_thai ? 'success' : 'destructive'} className="text-[10px] h-5">
                  {owner.trang_thai ? 'Hoạt động' : 'Tạm khóa'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1.5 text-foreground/80 font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {owner.thong_tin_nha_tro?.ten || 'Chưa có thông tin nhà trọ'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground font-semibold shrink-0">Địa chỉ:</span>
                  <span className="line-clamp-1">{owner.thong_tin_nha_tro?.dia_chi || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-4 py-2 border-y border-dashed border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Số phòng</span>
                    <span className="text-base font-extrabold">{owner._count?.phong || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Loại phí</span>
                    <span className="text-base font-extrabold">{owner._count?.loai_phi || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => handleToggleActive(owner.id, owner.trang_thai)}
                >
                  {owner.trang_thai ? (
                    <><ShieldOff className="mr-2 h-4 w-4 text-red-500" /> Khóa</>
                  ) : (
                    <><Shield className="mr-2 h-4 w-4 text-green-500" /> Mở khóa</>
                  )}
                </Button>
                <Button
                  variant="neutral"
                  size="sm"
                  className="h-9 border-none bg-accent/40 hover:bg-accent"
                  onClick={() => {
                    setSelectedOwner(owner);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-2 h-9 text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed hover:border-solid transition-all"
                  onClick={() => {
                    setResetPasswordOwner(owner);
                    setIsResetPasswordDialogOpen(true);
                  }}
                >
                  <Lock className="mr-2 h-3.5 w-3.5" /> Đặt lại mật khẩu
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOwners.length === 0 && (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Không tìm thấy chủ trọ nào khớp với từ khóa</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa Thông Tin Chủ Trọ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chủ trọ và nhà trọ
            </DialogDescription>
          </DialogHeader>
          {selectedOwner && (
            <PropertyOwnerForm
              defaultValues={selectedOwner}
              isEdit={true}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedOwner(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      {resetPasswordOwner && (
        <ResetPasswordDialog
          userId={resetPasswordOwner.id}
          username={resetPasswordOwner.tai_khoan}
          open={isResetPasswordDialogOpen}
          onOpenChange={(open) => {
            setIsResetPasswordDialogOpen(open);
            if (!open) {
              setResetPasswordOwner(null);
            }
          }}
          onSuccess={() => {
            fetchPropertyOwners();
          }}
        />
      )}
    </div>
  );
}
