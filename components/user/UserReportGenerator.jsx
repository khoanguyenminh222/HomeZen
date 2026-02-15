"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  FileText,
  Eye,
  Search,
  ChevronRight,
  Play,
  ExternalLink,
} from "lucide-react";
import { DynamicParameterInput } from "./DynamicParameterInput";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function UserReportGenerator() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [parameters, setParameters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = templates.filter(
    (t) =>
      t.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.mo_ta && t.mo_ta.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      setSelectedTemplate(template);
      // Initialize parameters
      initializeParameters(template);
    }
  }, [selectedTemplateId, templates]);

  async function initializeParameters(template) {
    const params = {};
    if (template?.anh_xa_tham_so) {
      // Get user session for auto-filling p_uid
      const session = await fetch("/api/auth/session").then((r) => r.json());
      const userId = session?.user?.id;

      template.anh_xa_tham_so.forEach((param) => {
        // Auto-fill p_uid with current user ID
        if (param.ten_tham_so === "p_uid" && userId) {
          params[param.ten_tham_so] = userId;
        } else {
          params[param.ten_tham_so] = "";
        }
      });
    }
    setParameters(params);
  }

  async function fetchTemplates() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/templates?limit=100");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách báo cáo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedTemplateId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn mẫu báo cáo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          parameters,
          format: "pdf",
        }),
      });

      // Parse JSON response to get fileUrl
      const data = await res.json();

      if (data.success && data.data.fileUrl) {
        setReportUrl(data.data.fileUrl);

        toast({
          title: "Thành công",
          description: "Đã tạo báo cáo thành công",
          variant: "success",
        });
      } else {
        throw new Error(data.error?.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo báo cáo",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleParameterChange(paramName, value) {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có báo cáo nào được phân quyền cho bạn.</p>
            <p className="text-sm mt-2">Vui lòng liên hệ quản trị viên.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:h-full bg-background border rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar: Report Selection */}
      <div className="w-full lg:w-80 border-r bg-muted/20 flex flex-col shrink-0">
        <div className="p-4 border-b bg-muted/40 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Danh Sách Báo Cáo
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm báo cáo..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Không tìm thấy báo cáo nào
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setReportUrl(""); // Clear preview on change
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all group relative",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-primary/10 border-transparent",
                    )}
                  >
                    <div className="flex flex-col pr-4">
                      <span className="font-bold text-sm line-clamp-1">
                        {template.ten}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] line-clamp-1",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {template.mo_ta || "Báo cáo hệ thống"}
                      </span>
                    </div>
                    {isSelected && (
                      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Parameters & Preview */}
      <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
        {!selectedTemplate ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 opacity-20" />
            </div>
            <h4 className="font-medium text-lg">Chào mừng bạn</h4>
            <p className="text-sm max-w-xs mt-1">
              Vui lòng chọn một mẫu báo cáo từ danh sách bên trái để bắt đầu cấu
              hình.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8 max-w-5xl mx-auto">
              {/* Parameter Configuration Area */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">
                      {selectedTemplate.ten}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTemplate.mo_ta}
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="shadow-md gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Tạo Báo Cáo
                  </Button>
                </div>

                {selectedTemplate?.anh_xa_tham_so?.filter(
                  (p) => p.ten_tham_so !== "p_uid",
                )?.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {selectedTemplate.anh_xa_tham_so
                      .filter((param) => param.ten_tham_so !== "p_uid")
                      .map((param) => (
                        <DynamicParameterInput
                          key={param.ten_tham_so}
                          param={param}
                          value={parameters[param.ten_tham_so] || ""}
                          onChange={(value) =>
                            handleParameterChange(param.ten_tham_so, value)
                          }
                        />
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 text-center text-sm text-muted-foreground border-2 border-dashed">
                    Báo cáo này không yêu cầu tham số bổ sung.
                  </div>
                )}
              </div>

              {/* PDF Preview Area */}
              {reportUrl ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Xem Trước Kết Quả
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = reportUrl;
                        a.download = `${selectedTemplate?.ten || "report"}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Tải Xuống PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(reportUrl, "_blank")}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Toàn Màn Hình
                    </Button>
                  </div>
                  <div className="border rounded-xl overflow-hidden bg-muted/10 shadow-lg ring-1 ring-primary/5">
                    <iframe
                      src={`${reportUrl}#toolbar=1`}
                      className="w-full h-[800px] border-none"
                      title="Report Preview"
                    />
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="h-[400px] flex flex-col gap-4 items-center justify-center bg-muted/10 border rounded-xl border-dashed">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                  <p className="text-sm font-medium animate-pulse">
                    Hệ thống đang trích xuất dữ liệu...
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
