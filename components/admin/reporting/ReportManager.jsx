"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Search,
  Copy,
  Trash2,
  Eye,
  Loader2,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";

/**
 * Thành phần quản lý danh sách báo cáo (Report Manager).
 * Thay thế cho TemplateList cũ với giao diện hiện đại hơn.
 * Các tính năng chính: Tìm kiếm nổi bật, Phân trang, và 3 nút hành động tối giản.
 */
export function ReportManager({ refreshTrigger, onAddNew, onEdit }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isActionInProgress, startActionTransition] = useTransition();

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  /**
   * Tải danh sách templates từ API (Task 13 - Server-side)
   */
  async function loadTemplates(page = currentPage, query = search) {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: query,
      });
      const res = await fetch(`/api/templates?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTemplates(json.templates || []);
        setTotalPages(json.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error("Lỗi tải templates:", error);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách từ máy chủ.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, [refreshTrigger, currentPage]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadTemplates();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (value) => {
    setSearch(value);
  };

  /**
   * Xử lý xóa template
   */
  const handleDelete = (template) => {
    if (!window.confirm(`Bạn có chắc muốn xóa template "${template.name}"?`))
      return;

    startActionTransition(async () => {
      try {
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          toast({
            title: "Đã xóa",
            description: `Đã xóa template "${template.name}"`,
            variant: "success",
          });
          loadTemplates();
        } else {
          throw new Error(json.message);
        }
      } catch (error) {
        toast({
          title: "Lỗi khi xóa",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  /**
   * Xử lý tạo bản sao (Copy)
   */
  const handleCopy = (template) => {
    startActionTransition(async () => {
      try {
        const res = await fetch(`/api/templates/${template.id}/copy`, {
          method: "POST",
        });
        const json = await res.json();
        if (json.success) {
          toast({
            title: "Thành công",
            description: "Đã tạo bản sao mới.",
            variant: "success",
          });
          loadTemplates();
        } else {
          throw new Error(json.message);
        }
      } catch (error) {
        toast({
          title: "Lỗi khi sao chép",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // currentData bây giờ chính là danh sách templates từ server
  const currentData = templates;

  return (
    <div className="space-y-6">
      {/* Search Bar - Compact & Professional */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Tìm mẫu báo cáo..."
                value={search}
                className="h-10 pl-10 bg-background border-primary/10 focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-lg text-sm transition-all duration-200 shadow-sm"
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button
              size="default"
              onClick={onAddNew}
              className="gap-2 px-5 h-10 shadow hover:shadow-primary/20 w-full sm:w-auto text-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo mẫu mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách báo cáo dạng bảng (Table-based) */}
      {isLoading ? (
        <Loading size="sm" text="Đang tải danh sách báo cáo..." />
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
          <p className="text-muted-foreground text-sm">
            Không tìm thấy báo cáo nào phù hợp.
          </p>
        </div>
      ) : (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Báo cáo
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Danh mục
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentData.map((t) => (
                  <tr
                    key={t.id}
                    className="group hover:bg-primary/5 transition-colors duration-150"
                    onClick={() => onEdit && onEdit(t.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <Eye className="h-4.5 w-4.5" />
                        </div> */}
                        <div className="min-w-0">
                          <div className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {t.description ||
                              "Không có mô tả cho mẫu báo cáo này."}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider shrink-0">
                        {t.category || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => handleCopy(t)}
                          disabled={isActionInProgress}
                          title="Tạo bản sao"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10 transition-colors"
                          onClick={() => onEdit && onEdit(t.id)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => handleDelete(t)}
                          disabled={isActionInProgress}
                          title="Xóa mẫu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination - Phân trang */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-4">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
