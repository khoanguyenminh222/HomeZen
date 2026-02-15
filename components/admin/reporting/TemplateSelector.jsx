"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Check,
  ExternalLink,
  FileText,
  Library,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TEMPLATE_SNIPPETS } from "./HTMLTemplateLibrary";
import { Loading } from "@/components/ui/loading";

/**
 * Component cho phép người dùng chọn template báo cáo.
 * Đã tích hợp cả các mẫu từ database và các mẫu HTML có sẵn từ thư viện.
 */
export function TemplateSelector({ onSelect, selectedId }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("system");

  // Phân trang cho system templates
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  async function fetchTemplates(page = currentPage, query = search) {
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
      console.error("Lỗi khi tải templates:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "system") {
      fetchTemplates();
    }
  }, [activeTab, currentPage]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "system") {
        if (currentPage === 1) {
          fetchTemplates();
        } else {
          setCurrentPage(1);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (val) => {
    setSearch(val);
  };

  // Library snippets vẫn filter client-side vì là dữ liệu tĩnh
  const filteredSnippets = TEMPLATE_SNIPPETS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full border rounded-xl bg-background overflow-hidden relative shadow-sm">
      {/* Header & Tabs */}
      <div className="p-3 border-b bg-muted/40 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mẫu báo cáo..."
            className="pl-9 bg-background h-9 border-muted-foreground/20 focus-visible:ring-primary"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger
              value="system"
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              Hệ thống
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              Thư viện
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-1">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="system" className="m-0 space-y-1">
              {isLoading ? (
                <Loading size="sm" text="Đang tải danh sách..." />
              ) : templates.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Không tìm thấy mẫu nào trong hệ thống.
                </div>
              ) : (
                <div className="space-y-1">
                  {templates.map((template) => {
                    const isSelected = selectedId === template.id;
                    return (
                      <div
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className={cn(
                          "group flex flex-col p-3 rounded-lg cursor-pointer transition-all border",
                          isSelected
                            ? "bg-primary/10 border-primary/30 shadow-sm"
                            : "hover:bg-muted border-transparent",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary",
                              )}
                            >
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {template.ten}
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                                {template.danh_muc || "General"}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-2 mt-2 bg-muted/30 rounded-lg border border-primary/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] uppercase font-bold px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] uppercase font-bold px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="library" className="m-0 space-y-1">
              {filteredSnippets.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Không tìm thấy mẫu thư viện phù hợp.
                </div>
              ) : (
                filteredSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    onClick={() => onSelect({ ...snippet, isSnippet: true })}
                    className="group flex flex-col p-3 rounded-lg border border-transparent hover:bg-muted hover:border-primary/20 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                        {snippet.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {snippet.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                          {snippet.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t bg-muted/20 text-[10px] text-center text-muted-foreground font-medium">
        {activeTab === "system"
          ? `${templates.length} mẫu hệ thống`
          : `${filteredSnippets.length} mẫu thư viện`}
      </div>
    </div>
  );
}
