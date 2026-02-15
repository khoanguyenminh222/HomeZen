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
} from '@/components/ui/dialog';
import PropertyOwnerForm from '@/components/admin/forms/PropertyOwnerForm';

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

  const handleEditSubmit = async (data) => {
    try {
      const response = await fetch(`/api/admin/properties/${selectedProperty.nguoi_dung_id}`, {
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
        description: 'Đã cập nhật thông tin nhà trọ thành công',
        variant: 'success',
      });

      setIsEditDialogOpen(false);
      setSelectedProperty(null);
      fetchProperties();
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err.message || 'Có lỗi xảy ra',
        variant: 'destructive',
      });
    }
  };

  const handleTransferSuccess = () => {
    setIsTransferDialogOpen(false);
    setSelectedProperty(null);
    fetchProperties();
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
                <CardTitle className="text-lg">{property.ten}</CardTitle>
                <Badge variant={property.nguoi_dung?.trang_thai ? 'default' : 'secondary'}>
                  {property.nguoi_dung?.trang_thai ? 'Hoạt động' : 'Vô hiệu hóa'}
                </Badge>
              </div>
              <CardDescription>
                Chủ trọ: {property.nguoi_dung?.tai_khoan || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Địa chỉ: </span>
                  <span>{property.dia_chi}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Số điện thoại: </span>
                  <span>{property.dien_thoai || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chủ nhà: </span>
                  <span>{property.ten_chu_nha || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{property.nguoi_dung?._count?.phong || 0} phòng</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{property.nguoi_dung?._count?.loai_phi || 0} loại phí</span>
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
            <PropertyOwnerForm
              defaultValues={selectedProperty}
              isEdit={true}
              isPropertyEditOnly={true}
              onSubmit={handleEditSubmit}
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
              onSuccess={handleTransferSuccess}
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
          owner => owner.id !== property.nguoi_dung_id && !owner.thong_tin_nha_tro
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
      const response = await fetch(`/api/admin/properties/${property.nguoi_dung_id}/assign`, {
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
        variant: 'success',
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
          value={property.nguoi_dung?.tai_khoan || 'N/A'}
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
              {owner.tai_khoan} {owner.thong_tin_nha_tro ? '(Đã có nhà trọ)' : ''}
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

