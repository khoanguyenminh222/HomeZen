'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, ShieldOff, Edit, Trash2 } from 'lucide-react';
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

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchPropertyOwners();
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
              onSuccess={handleCreateSuccess}
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
              <div className="flex gap-2 mt-4">
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
              owner={selectedOwner}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedOwner(null);
                fetchPropertyOwners();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedOwner(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Property Owner Form Component
function PropertyOwnerForm({ owner, onSuccess, onCancel }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: owner?.username || '',
    password: '',
    propertyName: owner?.propertyInfo?.name || '',
    propertyAddress: owner?.propertyInfo?.address || '',
    phone: owner?.propertyInfo?.phone || '',
    ownerName: owner?.propertyInfo?.ownerName || '',
    email: owner?.propertyInfo?.email || '',
    maxElectricMeter: owner?.propertyInfo?.maxElectricMeter || 999999,
    maxWaterMeter: owner?.propertyInfo?.maxWaterMeter || 99999,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (owner) {
        // Update existing owner
        const response = await fetch(`/api/admin/properties/${owner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyName: formData.propertyName,
            propertyAddress: formData.propertyAddress,
            phone: formData.phone,
            ownerName: formData.ownerName,
            email: formData.email,
            maxElectricMeter: formData.maxElectricMeter,
            maxWaterMeter: formData.maxWaterMeter,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Không thể cập nhật');
        }

        toast({
          title: 'Thành công',
          description: 'Đã cập nhật thông tin chủ trọ thành công',
        });
      } else {
        // Create new owner
        const response = await fetch('/api/admin/property-owners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Không thể tạo chủ trọ');
        }

        toast({
          title: 'Thành công',
          description: 'Đã tạo chủ trọ mới thành công',
        });
      }

      onSuccess();
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Username *</label>
          <input
            type="text"
            required
            disabled={!!owner}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        {!owner && (
          <div>
            <label className="text-sm font-medium">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Tên nhà trọ *</label>
          <input
            type="text"
            required
            value={formData.propertyName}
            onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Địa chỉ *</label>
          <input
            type="text"
            required
            value={formData.propertyAddress}
            onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Số điện thoại</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tên chủ nhà</label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Đồng hồ điện</label>
          <input
            type="number"
            value={formData.maxElectricMeter}
            onChange={(e) => setFormData({ ...formData, maxElectricMeter: parseInt(e.target.value) })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Đồng hồ nước</label>
          <input
            type="number"
            value={formData.maxWaterMeter}
            onChange={(e) => setFormData({ ...formData, maxWaterMeter: parseInt(e.target.value) })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang xử lý...' : owner ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
