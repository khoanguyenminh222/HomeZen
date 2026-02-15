"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Play,
  Download,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { TemplateSelector } from "./reporting/TemplateSelector";
import { cn } from "@/lib/utils";

/**
 * Thành phần sinh báo cáo (Report Generator).
 * Đã được nâng cấp để sử dụng TemplateSelector mới, giúp chọn mẫu dễ dàng hơn.
 */
export function ReportGenerator() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [parameters, setParameters] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [format, setFormat] = useState("pdf");
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  /**
   * Xử lý khi chọn một template từ TemplateSelector
   */
  const handleTemplateSelect = async (template) => {
    setGenerationResult(null);

    // Tải chi tiết template (bao gồm procedure parameters)
    try {
      const res = await fetch(`/api/templates/${template.id}`);
      const json = await res.json();
      if (json.success) {
        const fullTemplate = json.data;
        setSelectedTemplate(fullTemplate);

        // Khởi tạo các tham số dựa trên procedure
        const initialParams = {};
        (fullTemplate.thu_tuc?.tham_so || []).forEach((p) => {
          initialParams[p.name] = "";
        });
        setParameters(initialParams);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lấy thông tin chi tiết của mẫu",
        variant: "destructive",
      });
    }
  };

  /**
   * Tải danh sách phòng nếu cần thiết (cho bộ chọn phòng)
   */
  useEffect(() => {
    async function fetchRooms() {
      if (!selectedTemplate) return;

      const hasRoomSelect = selectedTemplate.anh_xa_tham_so?.some(
        (m) => m.loai_hien_thi === "ROOM_SELECT",
      );

      if (hasRoomSelect && rooms.length === 0) {
        try {
          setIsLoadingRooms(true);
          const res = await fetch("/api/rooms");
          const data = await res.json();
          if (Array.isArray(data)) {
            setRooms(data);
          }
        } catch (error) {
          console.error("Error fetching rooms for generator", error);
        } finally {
          setIsLoadingRooms(false);
        }
      }
    }
    fetchRooms();
  }, [selectedTemplate]);

  /**
   * Render bộ chọn tham số dựa trên cấu hình Mapping
   */
  const renderParameterInput = (param) => {
    if (param.name === "p_uid") return null;

    const mapping = selectedTemplate.anh_xa_tham_so?.find(
      (m) => m.ten_tham_so === param.name,
    );
    const type = mapping?.loai_hien_thi || "TEXT";

    const commonProps = {
      id: param.name,
      value: parameters[param.name] || "",
      onChange: (e) =>
        setParameters({ ...parameters, [param.name]: e.target.value }),
    };

    switch (type) {
      case "DATE":
        return <Input {...commonProps} type="date" className="h-9" />;
      case "NUMBER":
        return <Input {...commonProps} type="number" className="h-9" />;
      case "ROOM_SELECT":
        return (
          <Select
            value={parameters[param.name]}
            onValueChange={(val) =>
              setParameters({ ...parameters, [param.name]: val })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue
                placeholder={
                  isLoadingRooms ? "Đang tải phòng..." : "Chọn phòng..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.ma_phong} - {room.ten_phong}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "MONTH_SELECT":
        return (
          <Select
            value={parameters[param.name]}
            onValueChange={(val) =>
              setParameters({ ...parameters, [param.name]: val })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Chọn tháng..." />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "YEAR_SELECT":
        const currentYear = new Date().getFullYear();
        return (
          <Select
            value={parameters[param.name]}
            onValueChange={(val) =>
              setParameters({ ...parameters, [param.name]: val })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Chọn năm..." />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Năm {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            {...commonProps}
            placeholder={`Nhập ${param.name}...`}
            className="h-9 transition-all focus:border-primary"
          />
        );
    }
  };

  /**
   * Gửi yêu cầu sinh báo cáo tới API
   */
  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsGenerating(true);
      setGenerationResult(null);

      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          parameters,
          format: format,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast({
          title: "Thành công",
          description: "Đã sinh báo cáo thành công.",
          variant: "success",
        });
        setGenerationResult(json.data);
      } else {
        throw new Error(json.message || "Lỗi khi sinh báo cáo");
      }
    } catch (error) {
      toast({
        title: "Lỗi sinh báo cáo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:h-[calc(100vh-10rem)] bg-background border rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar: Template Selection */}
      <div className="w-full lg:w-80 border-r bg-muted/20 flex flex-col shrink-0">
        <div className="p-4 border-b bg-muted/40">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Mẫu Báo Cáo
          </h3>
        </div>
        <div className="flex-1 overflow-hidden p-2">
          <TemplateSelector
            onSelect={handleTemplateSelect}
            selectedId={selectedTemplate?.id}
          />
        </div>
      </div>

      {/* Main Content: Configuration & Preview */}
      <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
        {!selectedTemplate ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 opacity-20" />
            </div>
            <h4 className="font-medium text-lg">Hệ thống báo cáo</h4>
            <p className="text-sm max-w-xs mt-1">
              Vui lòng chọn một mẫu báo cáo từ danh sách bên trái để bắt đầu cấu
              hình và sinh dữ liệu.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8 max-w-5xl mx-auto">
              {/* Header & Configuration */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">
                      {selectedTemplate.ten}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTemplate.mo_ta || "Mẫu báo cáo hệ thống"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                          <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        </SelectContent>
                      </Select>
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
                      Sinh Báo Cáo
                    </Button>
                  </div>
                </div>

                {selectedTemplate.thu_tuc?.tham_so?.filter(
                  (p) => p.name !== "p_uid",
                ).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {selectedTemplate.thu_tuc.tham_so
                      .filter((p) => p.name !== "p_uid")
                      .map((param) => (
                        <div key={param.name} className="space-y-1.5">
                          <Label
                            htmlFor={param.name}
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {param.name}{" "}
                            <span className="lowercase font-normal">
                              ({param.type})
                            </span>
                          </Label>
                          {renderParameterInput(param)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 text-center text-sm text-muted-foreground border-2 border-dashed">
                    Không có tham số nào cần nhập cho mẫu này.
                  </div>
                )}
              </div>

              {/* Result Area: PDF Preview or Download */}
              {generationResult ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Kết Quả Báo Cáo
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a
                          href={generationResult.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                          Tải Xuống {format.toUpperCase()}
                        </a>
                      </Button>
                    </div>
                  </div>

                  {format === "pdf" ? (
                    <div className="border rounded-xl overflow-hidden bg-muted/10 shadow-lg ring-1 ring-primary/5">
                      <iframe
                        src={`${generationResult.fileUrl}#toolbar=0`}
                        className="w-full h-[800px] border-none"
                        title="Report Preview"
                      />
                    </div>
                  ) : (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl bg-primary/5">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="font-bold text-lg text-primary">
                        Tệp Excel đã sẵn sàng
                      </h4>
                      <p className="text-sm text-muted-foreground mb-6">
                        Định dạng Excel không hỗ trợ xem trực tiếp trong trình
                        duyệt.
                      </p>
                      <Button asChild>
                        <a href={generationResult.fileUrl} download>
                          Tải xuống ngay
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="h-[400px] flex flex-col gap-4 items-center justify-center bg-muted/10 border rounded-xl border-dashed">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                  <p className="text-sm font-medium animate-pulse">
                    Hệ thống đang xử lý dữ liệu...
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
