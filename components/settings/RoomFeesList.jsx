"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { Plus, Edit, Trash2 } from "lucide-react";
import RoomFeeForm from "./RoomFeeForm";
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
 * RoomFeesList - Danh sách phí của phòng
 * Requirements: 6.22-6.24
 */
export default function RoomFeesList({ roomId, roomCode }) {
  const [roomFees, setRoomFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoomFee, setEditingRoomFee] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (roomId) {
      fetchRoomFees();
    }
  }, [roomId]);

  const fetchRoomFees = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/rooms/${roomId}/fees?includeInactive=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setRoomFees(data);
    } catch (error) {
      console.error("Error fetching room fees:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phí của phòng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingRoomFee(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (roomFee) => {
    setEditingRoomFee(roomFee);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingRoomFee(null);
    fetchRoomFees();
  };

  const handleDelete = async (feeId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/fees/${feeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast({
        title: "Thành công",
        description: "Đã xóa phí của phòng",
        variant: "success",
      });
      fetchRoomFees();
      setDeleteDialogOpen((prev) => ({
        ...prev,
        [feeId]: false,
      }));
    } catch (error) {
      console.error("Error deleting room fee:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phí của phòng",
        variant: "destructive",
      });
    }
  };

  if (loading) return <Loading text="Đang tải danh sách phí..." />;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Phí của Phòng {roomCode}</CardTitle>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Gán Phí
          </Button>
        </CardHeader>
        <CardContent>
          {roomFees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Phòng này chưa có phí nào được gán
            </p>
          ) : (
            <div className="space-y-2">
              {roomFees.map((roomFee) => (
                <div
                  key={roomFee.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {roomFee.loai_phi?.ten_phi || "N/A"}
                      </p>
                      {roomFee.trang_thai ? (
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {roomFee.loai_phi?.mo_ta || ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <p className="font-bold">
                      {formatCurrency(roomFee.so_tien)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(roomFee)}
                        className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900 dark:hover:text-amber-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog
                        open={deleteDialogOpen[roomFee.id] || false}
                        onOpenChange={(open) => {
                          setDeleteDialogOpen((prev) => ({
                            ...prev,
                            [roomFee.id]: open,
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
                              [roomFee.id]: false,
                            }));
                          }}
                          onInteractOutside={(e) => {
                            setDeleteDialogOpen((prev) => ({
                              ...prev,
                              [roomFee.id]: false,
                            }));
                          }}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa phí "
                              {roomFee.loai_phi?.ten_phi}" khỏi phòng này?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                              Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(roomFee.id)}
                              variant="destructive"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RoomFeeForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRoomFee(null);
        }}
        roomId={roomId}
        roomFee={editingRoomFee}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
