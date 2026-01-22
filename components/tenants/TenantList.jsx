'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Users, Phone, MapPin, Calendar, DollarSign, Trash2 } from 'lucide-react';
import TenantForm from './TenantForm';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { Loading } from '@/components/ui/loading';

export default function TenantList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch tenants
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/tenants?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tenants');

      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người thuê',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Handle search
  const handleSearch = () => {
    fetchTenants();
  };

  // Handle create success
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchTenants();
    toast({
      title: 'Thành công',
      description: 'Đã thêm người thuê mới',
      variant: 'success'
    });
  };

  if (loading) {
    return <Loading text="Đang tải danh sách người thuê..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Người Thuê</h1>
          <p className="text-muted-foreground">
            Tổng cộng: {tenants.length} người thuê
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
            onClick={() => window.location.href = '/tenants/deleted'}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Lưu trữ
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md transition-all hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Thêm Người Thuê
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Thêm Người Thuê Mới</DialogTitle>
              </DialogHeader>
              <TenantForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, số điện thoại, mã phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" className="h-10 w-full sm:w-24">
          Tìm kiếm
        </Button>
      </div>

      {/* Tenant List */}
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có người thuê nào</h3>
            <p className="text-muted-foreground text-center mb-4">
              Bắt đầu bằng cách thêm người thuê đầu tiên
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Người Thuê
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card 
              key={tenant.id} 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => window.location.href = `/tenants/${tenant.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {tenant.fullName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {tenant.room ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {tenant.room.code}
                          </Badge>
                          {/* tên phòng */}
                          <Badge variant="outline" className="text-xs">
                            {tenant.room.name}
                          </Badge>
                          <Badge
                            className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"
                          >
                            Đang thuê
                          </Badge>
                        </>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-slate-100 text-slate-500 hover:bg-slate-100 border-none"
                        >
                          Chưa thuê
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {tenant.totalOccupants + 1} người
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{tenant.phone}</span>
                  </div>

                  {tenant.hometown && tenant.hometown !== '' ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{tenant.hometown}</span>
                    </div>
                  ) : 
                  <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">Chưa có quê quán</span>
                    </div>
                  }
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Vào: {formatDate(tenant.moveInDate)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>Cọc: {formatCurrency(tenant.deposit)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/tenants/${tenant.id}`;
                      }}
                    >
                      Chi tiết
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!tenant.room}
                      className={tenant.room
                        ? "flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors"
                        : "flex-1 opacity-50 cursor-not-allowed"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (tenant.room) {
                          window.location.href = `/bills/create?roomId=${tenant.room.id}`;
                        }
                      }}
                    >
                      Tạo hóa đơn
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}