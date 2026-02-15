"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Search,
  Trash2,
  Edit,
  Loader2,
  Clock,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ProcedureEditor } from "./ProcedureEditor";

import { useToast } from "@/hooks/use-toast";
import { Loading } from "../ui/loading";

/**
 * Hiển thị lịch sử thay đổi của một Procedure
 */
function HistoryModal({ procedure, isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && procedure?.id) {
      loadHistory();
    }
  }, [isOpen, procedure]);

  async function loadHistory() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/procedures/${procedure.id}/history`);
      const json = await res.json();
      if (json.success) setHistory(json.data || []);
    } catch (error) {
      console.error("Load history error", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lịch sử thay đổi: {procedure?.ten}
          </DialogTitle>
          <DialogDescription>
            Danh sách các phiên bản đã lưu của stored procedure này.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground italic">
              Chưa có bản ghi lịch sử nào.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">
                        v{h.phien_ban}
                      </span>
                      <span className="text-sm font-semibold">
                        {h.thong_tin_bo_sung?.ten || procedure.ten}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(h.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  {h.thong_tin_bo_sung?.mo_ta && (
                    <p className="text-xs text-muted-foreground">
                      {h.thong_tin_bo_sung.mo_ta}
                    </p>
                  )}
                  <div className="bg-muted p-2 rounded text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-auto border">
                    {h.dinh_nghia_sql}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProcedureList() {
  const { toast } = useToast();
  const [procedures, setProcedures] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [procedureForHistory, setProcedureForHistory] = useState(null);

  async function loadProcedures() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/procedures");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể tải danh sách procedures.");
      }
      setProcedures(json.data || []);
    } catch (error) {
      console.error("Load procedures error", error);
      toast({
        title: "Lỗi khi tải procedures",
        description: error.message || "Đã xảy ra lỗi không mong muốn.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProcedures();
  }, []);

  const filtered = procedures.filter((p) =>
    !search.trim()
      ? true
      : p.ten.toLowerCase().includes(search.toLowerCase()) ||
        (p.mo_ta || "").toLowerCase().includes(search.toLowerCase()),
  );

  function handleEdit(proc) {
    setSelectedProcedure(proc);
    setIsEditorOpen(true);
  }

  function handleOpenHistory(proc) {
    setProcedureForHistory(proc);
    setIsHistoryOpen(true);
  }

  function handleCreatedOrUpdated(proc) {
    loadProcedures();
    setIsEditorOpen(false);
    setSelectedProcedure(null);
  }

  function handleCreateNew() {
    setSelectedProcedure(null);
    setIsEditorOpen(true);
  }

  function handleDelete(proc) {
    if (
      !window.confirm(`Bạn có chắc muốn vô hiệu hóa procedure "${proc.ten}"?`)
    ) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        const res = await fetch(`/api/procedures/${proc.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Không thể xóa procedure.");
        }
        toast({
          title: "Đã vô hiệu hóa procedure",
          description: `"${proc.ten}" đã bị đánh dấu không còn hoạt động.`,
          variant: "success",
        });
        loadProcedures();
      } catch (error) {
        console.error("Delete procedure error", error);
        toast({
          title: "Lỗi khi xóa procedure",
          description: error.message || "Đã xảy ra lỗi không mong muốn.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Stored Procedures</CardTitle>
            <CardDescription>
              Quản lý định nghĩa dữ liệu cho hệ thống báo cáo.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider">
                    Tên & Mô tả
                  </th>
                  <th className="px-4 py-3 text-center font-bold uppercase text-[10px] tracking-wider">
                    Phiên bản
                  </th>
                  <th className="px-4 py-3 text-right font-bold uppercase text-[10px] tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-20 text-center text-muted-foreground"
                    >
                      <Loading />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-20 text-center text-muted-foreground"
                    >
                      Không tìm thấy procedure nào.
                    </td>
                  </tr>
                ) : (
                  filtered.map((proc) => (
                    <tr
                      key={proc.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <div className="font-bold text-base group-hover:text-primary transition-colors">
                          {proc.ten}
                        </div>
                        {proc.mo_ta && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {proc.mo_ta}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                          v{proc.phien_ban}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Lịch sử thay đổi"
                            onClick={() => handleOpenHistory(proc)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(proc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Vô hiệu hóa"
                            onClick={() => handleDelete(proc)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal chỉnh sửa/thêm mới */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-none w-screen h-screen flex flex-col p-6 rounded-none border-none">
          <DialogHeader>
            <DialogTitle>
              {selectedProcedure
                ? `Chỉnh sửa: ${selectedProcedure.ten}`
                : "Thêm mới Stored Procedure"}
            </DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tự động detect parameters và columns từ SQL function
              definition của bạn.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <ProcedureEditor
              initialProcedure={selectedProcedure}
              onSaved={handleCreatedOrUpdated}
              onClose={() => setIsEditorOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Lịch sử */}
      <HistoryModal
        procedure={procedureForHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
