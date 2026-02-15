"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * DeleteConfirmDialog - Dialog xác nhận xóa phòng
 */
export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  room,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent
        onOverlayClick={onClose}
        onInteractOutside={(e) => {
          onClose();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Xác nhận xóa phòng
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Bạn có chắc muốn xóa phòng <strong>{room?.ma_phong}</strong> -{" "}
            {room?.ten_phong}?
            <br />
            <br />
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="h-12 text-base dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            variant="destructive"
            className="h-12 text-base"
          >
            Xóa phòng
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
