"use client";

import { useState, useTransition } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "../ui/loading";
import { Info, FileCode2 } from "lucide-react";

/**
 * ProcedureEditor
 * - Tạo / chỉnh sửa stored procedure
 * - Gọi API /api/procedures/validate để validate SQL real-time
 * - Gọi API /api/procedures để lưu
 *
 * Props:
 * - initialProcedure: dữ liệu procedure để edit (optional)
 * - onSaved: callback khi lưu thành công
 */
export function ProcedureEditor({ initialProcedure, onSaved, onClose }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isValidating, setIsValidating] = useState(false);

  const [form, setForm] = useState({
    ten: initialProcedure?.ten || "",
    mo_ta: initialProcedure?.mo_ta || "",
    sql: initialProcedure?.dinh_nghia_sql || "",
  });

  const [validationResult, setValidationResult] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSqlChange = (value) => {
    setForm((prev) => ({ ...prev, sql: value || "" }));
  };

  async function handleValidate() {
    if (!form.sql.trim()) {
      toast({
        title: "Thiếu SQL",
        description: "Vui lòng nhập định nghĩa function trước khi validate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsValidating(true);
      const res = await fetch("/api/procedures/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: form.sql }),
      });
      const json = await res.json();
      setValidationResult(json.data || null);

      if (json.success) {
        toast({
          title: "SQL hợp lệ",
          description: "Cú pháp SQL đã được kiểm tra thành công.",
          variant: "success",
        });
      } else {
        toast({
          title: "SQL không hợp lệ",
          description:
            json.data?.errors?.[0]?.message ||
            json.message ||
            "Vui lòng kiểm tra lại cú pháp.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Validate SQL error", error);
      toast({
        title: "Lỗi khi validate SQL",
        description: error.message || "Đã xảy ra lỗi không mong muốn.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }

  function handleGenerateBoilerplate(type = "function") {
    const name = form.ten || "new_procedure";
    let template = "";

    if (type === "function") {
      template = `CREATE OR REPLACE FUNCTION ${name}(
    p_uid TEXT, -- Tham số id chủ trọ bắt buộc
    p_param1 TEXT,
    p_param2 INTEGER
) 
RETURNS TABLE (
    id TEXT,
    name TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    -- Viết nội dung query logic ở đây
    -- Luôn nhớ lọc theo p_uid (id tự động truyền vào)
    RETURN QUERY 
    SELECT 
        u.id, 
        u.username, 
        u.created_at
    FROM "User" u
    WHERE u.id = p_uid;
END;
$$ LANGUAGE plpgsql;`;
    } else {
      template = `CREATE OR REPLACE PROCEDURE ${name}(
    p_uid TEXT, -- Tham số id chủ trọ bắt buộc
    p_param1 TEXT,
    p_param2 INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    -- Khai báo biến ở đây
BEGIN
    -- Viết nội dung logic xử lý ở đây
    -- Luôn nhớ lọc theo p_uid
    RAISE NOTICE 'Procedure executed for UID: %', p_uid;
END;
$$;`;
    }

    setForm((prev) => ({ ...prev, sql: template }));
    toast({
      title: `Đã tạo mẫu ${type === "function" ? "Function" : "Procedure"}`,
      description: "Bạn có thể chỉnh sửa tên và cấu trúc theo nhu cầu.",
      variant: "success",
    });
  }

  async function handleSave() {
    if (!form.ten.trim() || !form.sql.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Tên procedure và SQL là bắt buộc.",
        variant: "destructive",
      });
      return;
    }

    const thong_tin_bo_sung = {
      ten: form.ten.trim(),
      mo_ta: form.mo_ta.trim() || null,
    };

    const payload = {
      sql: form.sql,
      thong_tin_bo_sung,
    };

    startTransition(async () => {
      try {
        const isEdit = Boolean(initialProcedure?.id);
        const url = isEdit
          ? `/api/procedures/${initialProcedure.id}`
          : "/api/procedures";
        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Không thể lưu procedure.");
        }

        toast({
          title: isEdit ? "Cập nhật thành công" : "Tạo procedure thành công",
          description: `Procedure "${json.data.ten}" đã được lưu.`,
        });

        onSaved?.(json.data);
      } catch (error) {
        console.error("Save procedure error", error);
        toast({
          title: "Lỗi khi lưu procedure",
          description: error.message || "Đã xảy ra lỗi không mong muốn.",
          variant: "destructive",
        });
      }
    });
  }

  const isSaving = isPending;

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 py-2 overflow-hidden">
      {/* Sidebar: Cấu hình & Thông tin (1/3) */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proc-name">Tên procedure</Label>
            <Input
              id="proc-name"
              placeholder="vd: revenue_summary_report"
              value={form.ten}
              onChange={handleChange("ten")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proc-description">Mô tả</Label>
            <Textarea
              id="proc-description"
              placeholder="Mô tả ngắn gọn về báo cáo này..."
              value={form.mo_ta}
              onChange={handleChange("mo_ta")}
              rows={4}
            />
          </div>

          <div className="bg-muted/40 p-3 rounded-md border border-muted">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2 text-xs">
              <Info className="h-3.5 w-3.5" />
              <span>Quy tắc bắt buộc:</span>
            </div>
            <ul className="text-[11px] space-y-2 text-muted-foreground list-disc pl-4 leading-relaxed">
              <li>
                Sử dụng cấu trúc{" "}
                <span className="text-foreground font-mono font-bold">
                  CREATE OR REPLACE
                </span>{" "}
                (Function hoặc Procedure).
              </li>
              <li>
                Tham số{" "}
                <span className="text-foreground font-mono font-bold">
                  p_uid
                </span>{" "}
                là bắt buộc để tự động lọc dữ liệu (không dùng tên khác).
              </li>
              <li className="text-primary font-medium">
                Tên tham số và từ khóa SQL{" "}
                <span className="underline">không phân biệt hoa/thường</span>{" "}
                (vd: P_UID hay p_uid đều được).
              </li>
              <li>
                Có thể tự do thêm các tham số khác tùy nhu cầu sau tham số{" "}
                <span className="text-foreground font-mono font-bold">
                  p_uid
                </span>
                .
              </li>
              <li>
                Nên sử dụng{" "}
                <span className="text-foreground font-mono font-bold">
                  RETURNS TABLE
                </span>{" "}
                cho các Function truy xuất dữ liệu báo cáo.
              </li>
            </ul>
          </div>

          {validationResult && (
            <div className="rounded-md border border-muted bg-muted/40 p-3 space-y-2 text-sm">
              <div className="font-semibold">
                {validationResult.isValid ? "✅ SQL hợp lệ" : "⚠️ SQL có lỗi"}
              </div>
              {validationResult.errors &&
                validationResult.errors.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-destructive">
                    {validationResult.errors.map((err, idx) => (
                      <li key={idx}>{err.message}</li>
                    ))}
                  </ul>
                )}
              {validationResult.detectedParameters?.length > 0 && (
                <div>
                  <div className="font-medium">Parameters phát hiện:</div>
                  <ul className="list-disc pl-5">
                    {validationResult.detectedParameters.map((p, idx) => (
                      <li key={idx}>
                        <span className="font-mono">{p.name}</span> –{" "}
                        <span className="text-muted-foreground">{p.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t space-y-2">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5 text-xs h-9"
                onClick={() => handleGenerateBoilerplate("function")}
                disabled={isSaving}
              >
                <FileCode2 className="h-3.5 w-3.5 mr-1" />
                Mẫu Function
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5 text-xs h-9"
                onClick={() => handleGenerateBoilerplate("procedure")}
                disabled={isSaving}
              >
                <FileCode2 className="h-3.5 w-3.5 mr-1" />
                Mẫu Procedure
              </Button>
            </div>
            <div className="h-2" />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleValidate}
              disabled={isSaving || isValidating}
            >
              {isValidating ? "Đang kiểm tra..." : "Validate SQL"}
            </Button>
            <Button
              type="button"
              className="w-full"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? "Đang lưu..."
                : initialProcedure
                  ? "Cập nhật"
                  : "Tạo mới"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={isSaving}
            >
              Hủy
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: SQL Editor (2/3) */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-md overflow-hidden bg-background relative">
        {/* <div className="absolute top-2 right-4 z-10 px-2 py-1 rounded bg-background/80 border text-[10px] uppercase font-bold tracking-wider text-muted-foreground pointer-events-none">
          PostgreSQL PL/pgSQL
        </div> */}
        <MonacoEditor
          height="100%"
          language="pgsql"
          theme="vs-dark"
          value={form.sql}
          onChange={handleSqlChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "var(--font-mono)",
            lineHeight: 1.6,
            padding: { top: 20, bottom: 20 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
          }}
          loading={<Loading text="Đang tải editor..." />}
        />
      </div>
    </div>
  );
}
