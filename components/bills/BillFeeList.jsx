"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Plus, Edit, Trash2 } from "lucide-react";
import BillFeeForm from "./BillFeeForm";
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

/**
 * BillFeeList - Danh sách phí phụ thu trong hóa đơn
 * Requirements: 6.22-6.25
 */
export default function BillFeeList({ billId, fees, isPaid, onUpdate }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState({});
  const { toast } = useToast();

  const handleAddClick = () => {
    setEditingFee(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (fee) => {
    setEditingFee(fee);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingFee(null);
    onUpdate?.();
  };

  const handleDelete = async (feeId) => {
    try {
      const response = await fetch(`/api/bills/${billId}/fees/${feeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete fee");
      }

      toast({
        title: "Thành công",
        description: "Đã xóa phí phụ thu",
        variant: "success",
      });
      onUpdate?.();
      setDeleteDialogOpen((prev) => ({
        ...prev,
        [feeId]: false,
      }));
    } catch (error) {
      console.error("Error deleting bill fee:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phí phụ thu",
        variant: "destructive",
      });
    }
  };

  if (!fees || fees.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Phí phụ thu</CardTitle>
          {!isPaid && (
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Phí
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Chưa có phí phụ thu nào
          </p>
        </CardContent>
        <BillFeeForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingFee(null);
          }}
          billId={billId}
          fee={editingFee}
          onSuccess={handleFormSuccess}
        />
      </Card>
    );
  }

  const totalFees = fees.reduce(
    (sum, fee) => sum + Number(fee.so_tien || 0),
    0,
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Phí phụ thu</CardTitle>
          {!isPaid && (
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Phí
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{fee.ten_phi}</p>
                  {/* {fee.feeTypeId && (
                    <p className="text-xs text-muted-foreground">
                      ID: {fee.feeTypeId}
                    </p>
                  )} */}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{formatCurrency(fee.so_tien)}</p>
                  {!isPaid && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(fee)}
                        className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900 dark:hover:text-amber-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={deleteDialogOpen[fee.id] || false}
                        onOpenChange={(open) => {
                          setDeleteDialogOpen((prev) => ({
                            ...prev,
                            [fee.id]: open,
                          }));
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive-900 dark:hover:text-destructive-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          onOverlayClick={() => {
                            setDeleteDialogOpen((prev) => ({
                              ...prev,
                              [fee.id]: false,
                            }));
                          }}
                          onInteractOutside={(e) => {
                            setDeleteDialogOpen((prev) => ({
                              ...prev,
                              [fee.id]: false,
                            }));
                          }}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa phí &ldquo;{fee.ten_phi}
                              &rdquo;?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                              Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(fee.id)}
                              variant="destructive"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t font-bold">
              <p>Tổng phí phụ thu</p>
              <p>{formatCurrency(totalFees)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BillFeeForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingFee(null);
        }}
        billId={billId}
        fee={editingFee}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
