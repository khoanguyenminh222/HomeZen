"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  RefreshCcw,
  Trash2,
  Search,
  Calendar,
  MessageSquare,
  User as UserIcon,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import { formatDate } from "@/lib/format";
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
} from "@/components/ui/alert-dialog";

export default function DeletedTenantsList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState({});
  const { toast } = useToast();

  const fetchDeletedTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/tenants/deleted?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người thuê đã xóa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedTenants();
  }, []);

  const handleRestore = async (id) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/tenants/${id}/restore`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to restore");

      toast({
        title: "Thành công",
        description: "Đã khôi phục hồ sơ người thuê",
        variant: "success",
      });
      fetchDeletedTenants();
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể khôi phục hồ sơ",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/tenants/${id}/permanent`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");

      toast({
        title: "Thành công",
        description: "Đã xóa vĩnh viễn hồ sơ",
        variant: "success",
      });
      fetchDeletedTenants();
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa vĩnh viễn",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <Loading text="Đang tải danh sách lưu trữ..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && fetchDeletedTenants()}
            className="pl-10 h-10"
          />
        </div>
        <Button onClick={fetchDeletedTenants} className="h-10 w-full sm:w-24">
          Tìm kiếm
        </Button>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-20" />
            <p>Không có hồ sơ nào trong thùng rác</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="border-red-100 bg-red-50/10">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg wrap-break-word">
                      {tenant.ho_ten}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground wrap-break-word">
                      {tenant.dien_thoai}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-200 w-fit"
                  >
                    Đã xóa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Xóa ngày: {formatDate(tenant.ngay_xoa)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Người xóa: {tenant.nguoi_xoa || "Hệ thống"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="italic">
                      Lý do: {tenant.ly_do_xoa || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                    disabled={isProcessing}
                    onClick={() => handleRestore(tenant.id)}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Khôi phục
                  </Button>

                  <AlertDialog
                    open={deleteDialogOpen[tenant.id] || false}
                    onOpenChange={(open) => {
                      setDeleteDialogOpen((prev) => ({
                        ...prev,
                        [tenant.id]: open,
                      }));
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 bg-red-600"
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa vĩnh viễn
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      className="w-[95vw] sm:w-full max-w-md"
                      onOverlayClick={() => {
                        setDeleteDialogOpen((prev) => ({
                          ...prev,
                          [tenant.id]: false,
                        }));
                      }}
                      onInteractOutside={(e) => {
                        setDeleteDialogOpen((prev) => ({
                          ...prev,
                          [tenant.id]: false,
                        }));
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          Cảnh báo nguy hiểm
                        </AlertDialogTitle>
                        <AlertDialogDescription className="wrap-break-word">
                          Hành động này sẽ xóa <strong>VĨNH VIỄN</strong> hồ sơ
                          người thuê <strong>{tenant.ho_ten}</strong>. Tất cả dữ
                          liệu liên quan sẽ biến mất và{" "}
                          <strong>KHÔNG THỂ</strong> khôi phục lại.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">
                          Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handlePermanentDelete(tenant.id);
                            setDeleteDialogOpen((prev) => ({
                              ...prev,
                              [tenant.id]: false,
                            }));
                          }}
                          variant="destructive"
                          className="w-full sm:w-auto"
                        >
                          Xác nhận xóa vĩnh viễn
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
