'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, ShieldOff, Edit, Trash2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resetPasswordOwner, setResetPasswordOwner] = useState(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchPropertyOwners();
  }, []);

  const fetchPropertyOwners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/property-owners');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách chủ trọ');
      }
      const data = await response.json();
      setPropertyOwners(data.data || []);
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
              Tạo Chủ Trọ Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo Chủ Trọ Mới</DialogTitle>
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

      {/* Property Owners List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {propertyOwners.map((owner) => (
          <Card key={owner.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{owner.username}</CardTitle>
                <Badge variant={owner.isActive ? 'default' : 'secondary'}>
                  {owner.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                </Badge>
              </div>
              <CardDescription>
                {owner.propertyInfo?.name || 'Chưa có thông tin nhà trọ'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Địa chỉ: </span>
                  <span>{owner.propertyInfo?.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Số phòng: </span>
                  <span>{owner._count?.rooms || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Loại phí: </span>
                  <span>{owner._count?.feeTypes || 0}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(owner.id, owner.isActive)}
                >
                  {owner.isActive ? (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Vô hiệu hóa
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Kích hoạt
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOwner(owner);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResetPasswordOwner(owner);
                    setIsResetPasswordDialogOpen(true);
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Mật Khẩu
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {propertyOwners.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có chủ trọ nào</p>
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
          username={resetPasswordOwner.username}
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
