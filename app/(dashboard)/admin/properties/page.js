'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Edit, ArrowRightLeft, Users, Home, FileText } from 'lucide-react';
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
 * Properties Management Page
 * Requirements: 1.3, 2.1, 2.2, 8.1
 */
export default function PropertiesPage() {
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/properties');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách nhà trọ');
      }
      const data = await response.json();
      setProperties(data.data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      toast({
        title: 'Lỗi',
        description: err.message || 'Không thể tải danh sách nhà trọ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setIsEditDialogOpen(true);
  };

  const handleTransfer = (property) => {
    setSelectedProperty(property);
    setIsTransferDialogOpen(true);
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản Lý Nhà Trọ</h2>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin nhà trọ trong hệ thống
          </p>
        </div>
      </div>

      {/* Properties List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{property.name}</CardTitle>
                <Badge variant={property.user?.isActive ? 'default' : 'secondary'}>
                  {property.user?.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                </Badge>
              </div>
              <CardDescription>
                Chủ trọ: {property.user?.username || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Địa chỉ: </span>
                  <span>{property.address}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Số điện thoại: </span>
                  <span>{property.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chủ nhà: </span>
                  <span>{property.ownerName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{property.user?._count?.rooms || 0} phòng</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{property.user?._count?.feeTypes || 0} loại phí</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(property)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTransfer(property)}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Chuyển
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có nhà trọ nào</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa Thông Tin Nhà Trọ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin nhà trọ
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <PropertyEditForm
              property={selectedProperty}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedProperty(null);
                fetchProperties();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedProperty(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển Quyền Sở Hữu Nhà Trọ</DialogTitle>
            <DialogDescription>
              Chuyển nhà trọ từ chủ trọ hiện tại sang chủ trọ khác
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <PropertyTransferForm
              property={selectedProperty}
              onSuccess={() => {
                setIsTransferDialogOpen(false);
                setSelectedProperty(null);
                fetchProperties();
              }}
              onCancel={() => {
                setIsTransferDialogOpen(false);
                setSelectedProperty(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Property Edit Form
function PropertyEditForm({ property, onSuccess, onCancel }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    propertyName: property.name,
    propertyAddress: property.address,
    phone: property.phone || '',
    ownerName: property.ownerName || '',
    email: property.email || '',
    maxElectricMeter: property.maxElectricMeter || 999999,
    maxWaterMeter: property.maxWaterMeter || 99999,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/properties/${property.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể cập nhật');
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin nhà trọ thành công',
      });

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
          {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
        </Button>
      </div>
    </form>
  );
}

// Property Transfer Form
function PropertyTransferForm({ property, onSuccess, onCancel }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyOwners, setPropertyOwners] = useState([]);
  const [toUserId, setToUserId] = useState('');

  useEffect(() => {
    fetchPropertyOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPropertyOwners = async () => {
    try {
      const response = await fetch('/api/admin/property-owners');
      if (response.ok) {
        const data = await response.json();
        // Filter out current owner and owners who already have properties
        const availableOwners = (data.data || []).filter(
          owner => owner.id !== property.userId && !owner.propertyInfo
        );
        setPropertyOwners(availableOwners);
      }
    } catch (err) {
      console.error('Error fetching property owners:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toUserId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn chủ trọ mới',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the transfer endpoint - note: the route is /api/admin/properties/[id]/assign
      // where [id] is the fromUserId (current owner)
      const response = await fetch(`/api/admin/properties/${property.userId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể chuyển quyền sở hữu');
      }

      toast({
        title: 'Thành công',
        description: 'Đã chuyển quyền sở hữu nhà trọ thành công',
      });

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
      <div>
        <label className="text-sm font-medium">Chủ trọ hiện tại</label>
        <input
          type="text"
          disabled
          value={property.user?.username || 'N/A'}
          className="w-full mt-1 px-3 py-2 border rounded-md bg-muted"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Chọn chủ trọ mới *</label>
        <select
          required
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
        >
          <option value="">-- Chọn chủ trọ --</option>
          {propertyOwners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.username} {owner.propertyInfo ? '(Đã có nhà trọ)' : ''}
            </option>
          ))}
        </select>
        {propertyOwners.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Không có chủ trọ nào khả dụng để chuyển
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting || propertyOwners.length === 0}>
          {isSubmitting ? 'Đang xử lý...' : 'Chuyển quyền sở hữu'}
        </Button>
      </div>
    </form>
  );
}
