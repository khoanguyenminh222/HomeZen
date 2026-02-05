"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Save,
  Eye,
  Tag,
  Loader2,
  AlertCircle,
  ChevronDown,
  Check as CheckIcon,
  Search,
  FileCode,
  Package,
  TrendingUp,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import MonacoEditor from "@monaco-editor/react";
import Handlebars from "handlebars";
import { toast } from "@/hooks/use-toast";
import { HTMLTemplateLibrary } from "@/components/admin/reporting/HTMLTemplateLibrary";

/**
 * Reusable Template Designer component.
 * Simplified version: Focused on Monaco Code Editing (HTML/Handlebars, CSS, JS).
 */
export function TemplateDesigner({ templateId, onSaveComplete, onLoad }) {
  const [templateInfo, setTemplateInfo] = useState({
    name: "Template mới",
    procedureId: "",
    description: "",
    category: "",
  });
  const [availableVariables, setAvailableVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [rawHtml, setRawHtml] = useState("");
  const [rawCss, setRawCss] = useState("");
  const [rawJs, setRawJs] = useState("");
  const [orientation, setOrientation] = useState("portrait");
  const [sampleData, setSampleData] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [isLoadingProcs, setIsLoadingProcs] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState(null);
  const [isProcOpen, setIsProcOpen] = useState(false);
  const [vSearch, setVSearch] = useState("");

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const insertText = (text) => {
    // Switch to template tab first
    setActiveTab("template");

    // Small delay to ensure the editor is rendered if switching tabs
    setTimeout(() => {
      const editor = editorRef.current;
      if (editor) {
        const selection = editor.getSelection();
        const id = { major: 1, minor: 1 };
        const textEdit = {
          range: selection,
          text: text,
          forceMoveMarkers: true,
        };
        editor.executeEdits("my-source", [textEdit]);
        editor.focus();
      } else {
        // Fallback: strictly append to rawHtml if editor not available
        setRawHtml((prev) => prev + text);
      }
    }, 100);
  };

  const filteredVariables = availableVariables.filter((v) =>
    v.name.toLowerCase().includes(vSearch.toLowerCase()),
  );

  // Fetch template data if editing
  useEffect(() => {
    async function loadTemplate() {
      if (!templateId) {
        setRawCss(`/* Cấu hình chung cho báo cáo Monochrome */
@page {
  margin: 0;
}

body {
  font-family: 'Times New Roman', Times, serif;
  margin: 0;
  padding: 10mm;
  line-height: 1.5;
  color: #000;
  background: #fff;
}

/* Kẻ bảng mặc định - Chỉ dùng đen trắng */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

table, th, td {
  border: 1px solid #000;
}

table th, table td {
  padding: 12px;
  text-align: left;
}

th {
  font-weight: bold;
  background-color: #fff;
}`);
        setRawHtml(``);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/templates/${templateId}`);
        const json = await res.json();
        if (json.success) {
          const t = json.data;
          setTemplateInfo({
            name: t.name,
            procedureId: t.procedureId,
            description: t.description || "",
            category: t.category || "",
          });

          if (t.content) setRawHtml(t.content);
          if (t.css) setRawCss(t.css);
          if (t.js) setRawJs(t.js);
          if (t.orientation) setOrientation(t.orientation);

          if (onLoad) onLoad(t);
        }
      } catch (err) {
        console.error("Failed to load template", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu template",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [templateId]);

  // Handlebars and Variables discovery
  useEffect(() => {
    if (!Handlebars.helpers.vnCurrency) {
      Handlebars.registerHelper("vnCurrency", (amount) => {
        if (amount === null || amount === undefined) return "";
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount);
      });
      Handlebars.registerHelper("vnDate", (date) => {
        if (!date) return "";
        const d = new Date(date);
        return isNaN(d.getTime()) ? date : d.toLocaleDateString("vi-VN");
      });
      Handlebars.registerHelper("vnNumber", (num) => {
        if (num === null || num === undefined) return "";
        return new Intl.NumberFormat("vi-VN").format(num);
      });
      Handlebars.registerHelper("eq", (a, b) => a === b);
      Handlebars.registerHelper("gt", (a, b) => a > b);
      Handlebars.registerHelper("lt", (a, b) => a < b);
      Handlebars.registerHelper("add", (a, b) => a + b);
      Handlebars.registerHelper("json", (context) =>
        JSON.stringify(context, null, 2),
      );
    }

    async function fetchVariables() {
      const pid = templateInfo.procedureId;
      if (!pid) {
        setAvailableVariables([]);
        setDiscoveryError(null);
        return;
      }
      try {
        setIsDiscovering(true);
        setDiscoveryError(null);
        const res = await fetch(`/api/reports/discover-variables/${pid}`);
        const json = await res.json();
        if (json.success) {
          if (!json.data || json.data.length === 0) {
            setDiscoveryError(
              "Procedure này không trả về dữ liệu mẫu hoặc không có biến.",
            );
            setAvailableVariables([]);
          } else {
            setAvailableVariables(json.data);
            setSampleData(json.sample);
          }
        } else {
          setDiscoveryError(
            json.message || "Không thể phân tích biến từ Procedure này.",
          );
          setAvailableVariables([]);
        }
      } catch (err) {
        console.error("Failed to fetch variables", err);
        setDiscoveryError("Lỗi kết nối khi lấy dữ liệu biến.");
        setAvailableVariables([]);
      } finally {
        setIsDiscovering(false);
      }
    }
    fetchVariables();
  }, [templateInfo.procedureId]);

  // Fetch procedures list
  useEffect(() => {
    async function fetchProcedures() {
      try {
        setIsLoadingProcs(true);
        const res = await fetch("/api/procedures");
        const json = await res.json();
        if (json.success) {
          setProcedures(json.data || []);
        }
      } catch (error) {
        console.error("Fetch procedures error", error);
      } finally {
        setIsLoadingProcs(false);
      }
    }
    fetchProcedures();
  }, []);

  const handleSave = async () => {
    if (!templateInfo.name || !templateInfo.procedureId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên và chọn Procedure",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("html", rawHtml);
      formData.append("name", templateInfo.name);
      formData.append("procedureId", templateInfo.procedureId);
      formData.append("description", templateInfo.description || "");
      formData.append("category", templateInfo.category || "");
      formData.append("css", rawCss || "");
      formData.append("js", rawJs || "");
      formData.append("orientation", orientation);
      // Gửi designerState rỗng vì đã gỡ bỏ tính năng kéo thả
      formData.append("designerState", "[]");

      const url = templateId
        ? `/api/templates/${templateId}`
        : "/api/templates";
      const method = templateId ? "PATCH" : "POST";

      const res = await fetch(url, { method, body: formData });
      const json = await res.json();

      if (json.success) {
        toast({
          title: "Thành công",
          description: "Mẫu báo cáo đã được lưu.",
          variant: "success",
        });
        if (onSaveComplete) onSaveComplete(json.data);
      } else {
        throw new Error(json.error?.message || "Lỗi khi lưu");
      }
    } catch (err) {
      toast({
        title: "Lỗi hệ thống",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    try {
      const template = Handlebars.compile(rawHtml);
      const htmlContent = template({
        data: [sampleData || {}],
        ...(sampleData || {}),
        metadata: {
          templateName: templateInfo.name,
          generatedAt: new Date().toLocaleString("vi-VN"),
          userName: "Preview User",
          isPreview: true,
        },
      });

      let result = htmlContent;
      if (rawCss) result = `<style>${rawCss}</style>${result}`;
      if (rawJs) result = `${result}<script>${rawJs}</script>`;
      return result;
    } catch (e) {
      return `
        <div style="padding: 30px; font-family: sans-serif; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px;">
          <h3 style="margin-top: 0; display: flex; items-center: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Lỗi biên dịch Handlebars
          </h3>
          <p style="font-size: 14px; margin-bottom: 10px;">Vui lòng kiểm tra lại cú pháp trong tab "Mã HTML".</p>
          <pre style="background: rgba(0,0,0,0.05); padding: 15px; border-radius: 4px; overflow: auto; font-size: 12px; border: 1px solid rgba(0,0,0,0.1);">${e.message}</pre>
        </div>
      `;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center justify-between p-3 border-b bg-muted/20 shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="preview" className="text-xs">
              Xem trước
            </TabsTrigger>
            <TabsTrigger value="template" className="text-xs">
              Mã HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="text-xs">
              CSS
            </TabsTrigger>
            <TabsTrigger value="js" className="text-xs">
              JavaScript
            </TabsTrigger>
            <TabsTrigger value="library" className="text-xs">
              Thư viện mẫu
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Cấu hình
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {templateId ? "Cập nhật" : "Lưu Template"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden bg-muted/10 relative">
          {activeTab === "preview" ? (
            <div className="w-full h-full p-4 overflow-auto flex justify-center bg-muted/30">
              <div
                className="shadow-2xl bg-white rounded-sm origin-top"
                style={{
                  width: orientation === "portrait" ? "210mm" : "297mm",
                  minHeight: orientation === "portrait" ? "297mm" : "210mm",
                }}
              >
                <iframe
                  srcDoc={renderPreview()}
                  className="w-full h-full border-none"
                  title="Preview"
                />
              </div>
            </div>
          ) : activeTab === "library" ? (
            <div className="p-8 overflow-auto h-full space-y-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-bold">Thư viện mẫu nhanh</h3>
                  <p className="text-sm text-muted-foreground">
                    Chọn một mẫu để ghi đè vào nội dung HTML hiện tại.
                  </p>
                </div>
                <HTMLTemplateLibrary
                  onSelect={(content) => {
                    const proceed =
                      !rawHtml ||
                      confirm(
                        "Lưu ý: Hành động này sẽ ghi đè toàn bộ nội dung HTML hiện tại. Bạn có chắc chắn muốn tiếp tục?",
                      );

                    if (proceed) {
                      setRawHtml(content);
                      toast({
                        title: "Đã áp dụng",
                        description:
                          "Mẫu đã được tải vào trình soạn thảo HTML.",
                      });
                      setActiveTab("template");
                    }
                  }}
                />
              </div>
            </div>
          ) : activeTab === "settings" ? (
            <div className="p-8 max-w-2xl mx-auto space-y-6 overflow-auto h-full">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Cấu hình báo cáo</h3>
                <Separator />
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Tên mẫu báo cáo</Label>
                    <Input
                      value={templateInfo.name}
                      onChange={(e) =>
                        setTemplateInfo({
                          ...templateInfo,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={templateInfo.description}
                      onChange={(e) =>
                        setTemplateInfo({
                          ...templateInfo,
                          description: e.target.value,
                        })
                      }
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary font-bold">
                      Nguồn dữ liệu (Stored Procedure) *
                    </Label>
                    <Popover open={isProcOpen} onOpenChange={setIsProcOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isProcOpen}
                          className="w-full justify-between h-10 border-primary/30 focus:border-primary px-3 bg-background font-normal"
                          type="button"
                        >
                          <span className="truncate flex items-center gap-2">
                            {templateInfo.procedureId ? (
                              procedures.find(
                                (p) => p.id === templateInfo.procedureId,
                              )?.name
                            ) : isLoadingProcs ? (
                              <Loading
                                size="sm"
                                text="Đang tải..."
                                className="py-0"
                              />
                            ) : (
                              "Chọn procedure..."
                            )}
                          </span>
                          <ChevronDown
                            className={cn(
                              "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                              isProcOpen && "rotate-180",
                            )}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Tìm procedure..."
                            className="h-9"
                          />
                          <CommandList className="max-h-60 overflow-y-auto custom-scrollbar">
                            <CommandEmpty className="p-4 text-center text-xs text-muted-foreground italic">
                              Không tìm thấy procedure nào.
                            </CommandEmpty>
                            <CommandGroup>
                              {procedures.map((proc) => (
                                <CommandItem
                                  key={proc.id}
                                  value={proc.name}
                                  onSelect={() => {
                                    setTemplateInfo({
                                      ...templateInfo,
                                      procedureId: proc.id,
                                    });
                                    setIsProcOpen(false);
                                  }}
                                  className="flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate flex-1">
                                    {proc.name}
                                  </span>
                                  <CheckIcon
                                    className={cn(
                                      "ml-2 h-4 w-4 shrink-0",
                                      templateInfo.procedureId === proc.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-[10px] text-muted-foreground italic">
                      Procedure cung cấp các biến dữ liệu được liệt kê ở cột bên
                      phải.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hướng giấy</Label>
                      <Select
                        value={orientation}
                        onValueChange={setOrientation}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">
                            Dọc (Portrait)
                          </SelectItem>
                          <SelectItem value="landscape">
                            Ngang (Landscape)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Danh mục</Label>
                      <Input
                        value={templateInfo.category}
                        onChange={(e) =>
                          setTemplateInfo({
                            ...templateInfo,
                            category: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <MonacoEditor
              height="100%"
              theme="vs-dark"
              language={
                activeTab === "template"
                  ? "html"
                  : activeTab === "css"
                    ? "css"
                    : "javascript"
              }
              value={
                activeTab === "template"
                  ? rawHtml
                  : activeTab === "css"
                    ? rawCss
                    : rawJs
              }
              onChange={(val) => {
                if (activeTab === "template") setRawHtml(val);
                else if (activeTab === "css") setRawCss(val);
                else setRawJs(val);
              }}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 13,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                folding: true,
                lineNumbers: "on",
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
              }}
            />
          )}
        </div>

        <div className="w-80 border-l bg-muted/5 flex flex-col shrink-0">
          <div className="p-3 border-b bg-muted/40 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Tag className="h-3.5 w-3.5" />
            Biến dữ liệu
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {isDiscovering ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[10px]">Đang phân tích biến...</span>
              </div>
            ) : discoveryError ? (
              <div className="p-4 flex flex-col items-center text-center gap-2">
                <AlertCircle className="h-8 w-8 text-orange-400 opacity-50" />
                <p className="text-[10px] text-orange-600 font-medium">
                  {discoveryError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => {
                    const pid = templateInfo.procedureId;
                    setTemplateInfo({ ...templateInfo, procedureId: "" });
                    setTimeout(
                      () =>
                        setTemplateInfo({
                          ...templateInfo,
                          procedureId: pid,
                        }),
                      10,
                    );
                  }}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b bg-muted/20">
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Tìm biến..."
                      className="h-8 pl-8 text-xs bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30"
                      value={vSearch}
                      onChange={(e) => setVSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-3">
                  {filteredVariables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 opacity-50 border-2 border-dashed rounded-xl border-muted">
                      <FileCode className="h-6 w-6 mb-2" />
                      <span className="text-[10px] text-center px-4">
                        {vSearch
                          ? "Không tìm thấy biến phù hợp"
                          : "Chưa phát hiện biến dữ liệu..."}
                      </span>
                    </div>
                  ) : (
                    filteredVariables.map((v) => (
                      <div
                        key={v.name}
                        className="group relative p-2.5 border rounded-xl bg-background hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-200"
                        onClick={() => {
                          const tag = `{{${v.name}}}`;
                          insertText(tag);
                          toast({
                            title: "Đã chèn",
                            description: tag,
                            variant: "success",
                          });
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={cn(
                              "p-1.5 rounded-lg",
                              v.type === "array"
                                ? "bg-blue-500/10 text-blue-600"
                                : v.type === "number" || v.type === "currency"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-amber-500/10 text-amber-600",
                            )}
                          >
                            {v.type === "array" ? (
                              <Package className="h-3 w-3" />
                            ) : v.type === "number" || v.type === "currency" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <FileCode className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-[11px] font-bold text-foreground truncate">
                              {v.name}
                            </div>
                            <div className="text-[8px] text-muted-foreground font-bold tracking-tighter">
                              {v.type}
                            </div>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 transition-opacity">
                          <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                            Copy
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* HELPERS CHUẨN - REFINED UI */}
          <div className="p-3 border-t bg-muted/30 flex flex-col overflow-hidden min-h-0 max-h-[350px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Helpers chuẩn
              </span>
              <div className="h-0.5 flex-1 mx-2 bg-muted-foreground/10 rounded-full" />
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar space-y-4 pr-1">
              {/* Cấu trúc */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                    Cấu trúc
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    {
                      l: "Vòng lặp",
                      c: "{{#each data}}\n  {{this}}\n{{/each}}",
                      d: "Duyệt mảng",
                    },
                    {
                      l: "Điều kiện",
                      c: "{{#if cond}}\n  ...\n{{else}}\n  ...\n{{/if}}",
                      d: "Nếu/Thì",
                    },
                    { l: "So sánh", c: "{{#if (eq a b)}}", d: "Bằng nhau" },
                    { l: "Cấp cha", c: "{{../property}}", d: "Ngoài mảng" },
                  ].map((h) => (
                    <Button
                      key={h.l}
                      variant="ghost"
                      className="h-7 w-full justify-between items-center px-2 text-[10px] font-mono hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg group/btn"
                      onClick={() => {
                        insertText(h.c);
                        toast({
                          title: "Đã chèn",
                          description: h.l,
                          variant: "success",
                        });
                      }}
                      title={h.c}
                    >
                      <span className="font-semibold text-foreground/80">
                        {h.l}
                      </span>
                      <span className="text-[9px] opacity-40 italic group-hover/btn:opacity-100 transition-opacity truncate ml-2">
                        {h.d}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Định dạng */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="h-1 w-1 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                    Định dạng
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { l: "Tiền tệ", c: "{{vnCurrency value}}", d: "VND" },
                    { l: "Ngày", c: "{{vnDate value}}", d: "Ngày/Tháng" },
                    { l: "Số", c: "{{vnNumber value}}", d: "1.000" },
                  ].map((h) => (
                    <Button
                      key={h.l}
                      variant="ghost"
                      className="h-7 w-full justify-between items-center px-2 text-[10px] font-mono hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg group/btn"
                      onClick={() => {
                        toast({
                          title: "Đã chèn",
                          description: h.l,
                          variant: "success",
                        });
                        insertText(h.c);
                      }}
                    >
                      <span className="font-semibold text-foreground/80">
                        {h.l}
                      </span>
                      <span className="text-[9px] opacity-40 group-hover/btn:opacity-100 italic transition-opacity ml-2">
                        {h.d}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tiện ích */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                    Tiện ích
                  </span>
                </div>
                {[
                  { l: "Số thứ tự", c: "{{add @index 1}}", d: "+1" },
                  { l: "Debug JSON", c: "{{json this}}", d: "Xem biến" },
                ].map((h) => (
                  <Button
                    key={h.l}
                    variant="ghost"
                    className="h-7 w-full justify-between items-center px-2 text-[10px] font-mono hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-lg group/btn"
                    onClick={() => {
                      insertText(h.c);
                      toast({
                        title: "Đã chèn",
                        description: h.l,
                        variant: "success",
                      });
                    }}
                  >
                    <span className="font-semibold text-foreground/80">
                      {h.l}
                    </span>
                    <span className="text-[9px] opacity-40 group-hover/btn:opacity-100 italic transition-opacity ml-2">
                      {h.d}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
