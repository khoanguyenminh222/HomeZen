'use client';

import { useState } from 'react';
import { ProcedureList } from '@/components/admin/ProcedureList';
import { ReportManager } from '@/components/admin/reporting/ReportManager';
import { TemplateDesigner } from '@/components/admin/reporting/TemplateDesigner';
import { ReportGenerator } from '@/components/admin/ReportGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database as DatabaseIcon, FileCode as FileCodeIcon, FileText as FileTextIcon, Play as PlayIcon, Loader2 as Loader2Icon, Paintbrush as PaintbrushIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Trang quản lý báo cáo chính (Admin Reporting Page)
 */
export default function AdminReportingPage() {
  const [refreshTemplates, setRefreshTemplates] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [isDesigning, setIsDesigning] = useState(false);
  const { toast } = useToast();

  const handleEditTemplate = (id) => {
    setEditingTemplateId(id);
    setIsDesigning(true);
  };

  const handleDesignerSaveComplete = () => {
    setRefreshTemplates(prev => prev + 1);
    setIsDesigning(false);
    setEditingTemplateId(null);
  };

  const handleTemplateUpdated = () => {
    setRefreshTemplates(prev => prev + 1);
  };

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/reports/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Thành công", description: "Đã khởi tạo các báo cáo mẫu.", variant: "success" });
        setRefreshTemplates(prev => prev + 1);
        window.location.reload();
      } else {
        throw new Error(json.error?.message || "Lỗi khi seed");
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Hệ thống báo cáo nâng cao</h2>
          <p className="text-muted-foreground mt-1">
            Thiết lập stored procedures và HTML templates để tạo báo cáo tự động chất lượng cao.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={isSeeding}
            className="gap-2"
          >
            {isSeeding ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
            Khởi tạo báo cáo mẫu
          </Button>
        </div>
      </div>

      <Tabs defaultValue="procedures" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="procedures" className="gap-2 data-[state=active]:bg-background">
            <DatabaseIcon className="h-4 w-4" />
            Stored Procedures
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-background">
            <FileCodeIcon className="h-4 w-4" />
            Template Báo Cáo
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2 data-[state=active]:bg-background">
            <FileTextIcon className="h-4 w-4" />
            Sinh Báo Cáo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="procedures" className="mt-6 space-y-4">
          <ProcedureList />
        </TabsContent>

        <TabsContent value="templates" className="mt-6 space-y-6">
          <ReportManager
            refreshTrigger={refreshTemplates}
            onAddNew={() => handleEditTemplate(null)}
            onEdit={handleEditTemplate}
          />
        </TabsContent>

        <TabsContent value="generate" className="mt-6 space-y-6">
          <ReportGenerator />
        </TabsContent>
      </Tabs>

      {/* Template Designer Overlay */}
      {isDesigning && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-4 border-b bg-muted/40 shrink-0">
            <h2 className="font-bold text-lg">
              {editingTemplateId ? "Chỉnh sửa mẫu báo cáo" : "Tạo mẫu báo cáo mới"}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsDesigning(false)}>
              Đóng
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TemplateDesigner
              templateId={editingTemplateId}
              onSaveComplete={handleDesignerSaveComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
