"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Play, History, Download, Loader2, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { TemplateSelector } from "./reporting/TemplateSelector";

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
                (fullTemplate.procedure?.parameters || []).forEach(p => {
                    initialParams[p.name] = "";
                });
                setParameters(initialParams);
            }
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể lấy thông tin chi tiết của mẫu", variant: "destructive" });
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
                    format: format
                })
            });

            const json = await res.json();
            if (json.success) {
                toast({ title: "Thành công", description: "Đã sinh báo cáo thành công.", variant: "success" });
                setGenerationResult(json.data);
            } else {
                throw new Error(json.message || "Lỗi khi sinh báo cáo");
            }
        } catch (error) {
            toast({ title: "Lỗi sinh báo cáo", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
                {/* Cột trái: Chọn Template */}
                <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        1. Chọn mẫu báo cáo
                    </Label>
                    <div className="h-[500px]">
                        <TemplateSelector
                            onSelect={handleTemplateSelect}
                            selectedId={selectedTemplate?.id}
                        />
                    </div>
                </div>

                {/* Cột phải: Cấu hình và Kết quả */}
                <div className="space-y-6">
                    <Card className="h-full shadow-md border-primary/10">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Play className="h-5 w-5 text-primary" />
                                Thiết lập & Sinh báo cáo
                            </CardTitle>
                            <CardDescription>
                                Nhập các tham số cần thiết và chọn định dạng đầu ra.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-sm font-semibold">Định dạng tập tin</Label>
                                    <Select value={format} onValueChange={setFormat}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF (.pdf) - Khuyên dùng</SelectItem>
                                            <SelectItem value="excel">Excel (.xlsx) - Di sản</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {selectedTemplate ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                                        <h4 className="font-bold text-primary flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            {selectedTemplate.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedTemplate.description || "Mẫu này chưa có mô tả."}
                                        </p>
                                    </div>

                                    {selectedTemplate.procedure?.parameters?.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {selectedTemplate.procedure.parameters.map(param => (
                                                <div key={param.name} className="space-y-1.5">
                                                    <Label htmlFor={param.name} className="text-xs font-semibold">
                                                        {param.name} <span className="text-muted-foreground font-normal">({param.type})</span>
                                                    </Label>
                                                    <Input
                                                        id={param.name}
                                                        className="h-9 transition-all focus:border-primary"
                                                        placeholder={`Nhập ${param.name}...`}
                                                        value={parameters[param.name] || ""}
                                                        onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed text-xs">
                                            Không có tham số nào cần nhập cho mẫu này.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    Vui lòng chọn một mẫu bên trái để bắt đầu
                                </div>
                            )}

                            {generationResult && (
                                <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 flex items-center justify-between animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Download className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-primary">Báo cáo đã sẵn sàng!</div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                {generationResult.fileName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" className="gap-2 shadow-sm">
                                            <a href={generationResult.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Play className="h-4 w-4" />
                                                Xem & Tải
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4">
                            <Button
                                size="lg"
                                className="w-full gap-2 shadow-lg"
                                onClick={handleGenerate}
                                disabled={!selectedTemplate || isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Đang tạo báo cáo...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-5 w-5 fill-current" />
                                        Bắt đầu sinh báo cáo
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
