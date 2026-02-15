"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import FeeTypeForm from "./FeeTypeForm";
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
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";

/**
 * FeeTypeList - Danh sách loại phí
 * Requirements: 6.22-6.24
 */
export default function FeeTypeList() {
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    fetchFeeTypes();
  }, []);

  const fetchFeeTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/settings/fee-types?includeInactive=true",
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setFeeTypes(data);
    } catch (error) {
      console.error("Error fetching fee types:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách loại phí",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingFeeType(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (feeType) => {
    setEditingFeeType(feeType);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingFeeType(null);
    fetchFeeTypes();
  };

  const handleDelete = async (feeTypeId) => {
    try {
      const response = await fetch(`/api/settings/fee-types/${feeTypeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast({
        title: "Thành công",
        description: "Đã xóa loại phí",
        variant: "success",
      });
      fetchFeeTypes();
      setDeleteDialogOpen((prev) => ({
        ...prev,
        [feeTypeId]: false,
      }));
    } catch (error) {
      console.error("Error deleting fee type:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa loại phí",
        variant: "destructive",
      });
    }
  };

  if (loading) return <Loading text="Đang tải danh sách loại phí..." />;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Loại Phí</CardTitle>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Loại Phí
          </Button>
        </CardHeader>
        <CardContent>
          {feeTypes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có loại phí nào
            </p>
          ) : (
            <div className="space-y-2">
              {feeTypes.map((feeType) => (
                <div
                  key={feeType.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{feeType.ten_phi}</p>
                      {feeType.trang_thai ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200"
                        >
                          Tạm ngưng
                        </Badge>
                      )}
                    </div>
                    {feeType.mo_ta && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {feeType.mo_ta}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(feeType)}
                      className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900 dark:hover:text-amber-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={deleteDialogOpen[feeType.id] || false}
                      onOpenChange={(open) => {
                        setDeleteDialogOpen((prev) => ({
                          ...prev,
                          [feeType.id]: open,
                        }));
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        onOverlayClick={() => {
                          setDeleteDialogOpen((prev) => ({
                            ...prev,
                            [feeType.id]: false,
                          }));
                        }}
                        onInteractOutside={(e) => {
                          setDeleteDialogOpen((prev) => ({
                            ...prev,
                            [feeType.id]: false,
                          }));
                        }}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa loại phí "
                            {feeType.ten_phi}"?
                            {feeType._count?.phi_phong > 0 && (
                              <span className="block mt-2 text-destructive">
                                Cảnh báo: Loại phí này đang được sử dụng bởi{" "}
                                {feeType._count.phi_phong} phòng.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                            Hủy
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(feeType.id)}
                            variant="destructive"
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FeeTypeForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingFeeType(null);
        }}
        feeType={editingFeeType}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
