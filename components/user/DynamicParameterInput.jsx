"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DynamicParameterInput({ param, value, onChange, error }) {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const displayType = param.displayType || param.loai_hien_thi || "TEXT";

  useEffect(() => {
    if (displayType === "ROOM_SELECT") {
      fetchOptions("/api/rooms/list");
    } else if (param.metadata?.dataSource) {
      // DataSource could be a key or a full URL
      const url = param.metadata.dataSource.startsWith("/")
        ? param.metadata.dataSource
        : `/api/${param.metadata.dataSource}`;
      fetchOptions(url);
    }
  }, [displayType, param.metadata?.dataSource]);

  async function fetchOptions(url) {
    try {
      setIsLoading(true);
      const res = await fetch(url);
      const data = await res.json();

      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.success) {
        items = data.data || data.rooms || [];
      }

      setOptions(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const renderRequiredIndicator = () =>
    param.required && <span className="text-destructive ml-1">*</span>;

  const renderError = () =>
    error && (
      <p className="text-[10px] text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    );

  // 1. DATE PICKER
  if (displayType === "DATE") {
    return (
      <div className="space-y-2">
        <Label htmlFor={param.name} className={cn(error && "text-destructive")}>
          {param.label || param.name}
          {renderRequiredIndicator()}
        </Label>
        <Input
          id={param.name}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {renderError()}
      </div>
    );
  }

  // 2. MONTH SELECT
  if (displayType === "MONTH_SELECT") {
    const months = Array.from({ length: 12 }, (_, i) => ({
      id: (i + 1).toString(),
      label: `Tháng ${i + 1}`,
    }));
    return (
      <div className="space-y-2">
        <Label htmlFor={param.name} className={cn(error && "text-destructive")}>
          {param.label || param.name}
          {renderRequiredIndicator()}
        </Label>
        <Select value={String(value || "")} onValueChange={onChange}>
          <SelectTrigger
            id={param.name}
            className={cn(error && "border-destructive")}
          >
            <SelectValue placeholder="Chọn tháng" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderError()}
      </div>
    );
  }

  // 3. YEAR SELECT
  if (displayType === "YEAR_SELECT") {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => ({
      id: (currentYear - 5 + i).toString(),
      label: `Năm ${currentYear - 5 + i}`,
    }));
    return (
      <div className="space-y-2">
        <Label htmlFor={param.name} className={cn(error && "text-destructive")}>
          {param.label || param.name}
          {renderRequiredIndicator()}
        </Label>
        <Select value={String(value || "")} onValueChange={onChange}>
          <SelectTrigger
            id={param.name}
            className={cn(error && "border-destructive")}
          >
            <SelectValue placeholder="Chọn năm" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderError()}
      </div>
    );
  }

  // 4. ROOM_SELECT or DROPDOWN (Single Select)
  if (
    (displayType === "ROOM_SELECT" || options.length > 0 || isLoading) &&
    displayType !== "MULTI_SELECT"
  ) {
    return (
      <div className="space-y-2">
        <Label htmlFor={param.name} className={cn(error && "text-destructive")}>
          {param.label || param.name}
          {renderRequiredIndicator()}
        </Label>
        {isLoading ? (
          <div className="flex items-center justify-center h-10 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select value={String(value || "")} onValueChange={onChange}>
            <SelectTrigger
              id={param.name}
              className={cn(error && "border-destructive")}
            >
              <SelectValue placeholder={`Chọn ${param.label || param.name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.ten || option.ten_phong || option.label || option.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {renderError()}
      </div>
    );
  }

  // 5. NUMBER
  if (displayType === "NUMBER") {
    return (
      <div className="space-y-2">
        <Label htmlFor={param.name} className={cn(error && "text-destructive")}>
          {param.label || param.name}
          {renderRequiredIndicator()}
        </Label>
        <Input
          id={param.name}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {renderError()}
      </div>
    );
  }

  // 6. MULTI_SELECT (Simple Implementation using Checkboxes or Select with multiple)
  if (displayType === "MULTI_SELECT") {
    // For simplicity, we can use a more advanced component here,
    // but let's stick to a robust basic version for now.
    return (
      <div className="space-y-2">
        <Label className={cn(error && "text-destructive")}>
          {param.label || param.name}
          {renderRequiredIndicator()}
        </Label>
        <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-background">
          {options.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`${param.name}-${option.id}`}
                checked={
                  Array.isArray(value) && value.includes(String(option.id))
                }
                onCheckedChange={(checked) => {
                  const currentValues = Array.isArray(value) ? [...value] : [];
                  if (checked) {
                    onChange([...currentValues, String(option.id)]);
                  } else {
                    onChange(
                      currentValues.filter((v) => v !== String(option.id)),
                    );
                  }
                }}
              />
              <label
                htmlFor={`${param.name}-${option.id}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {option.ten || option.ten_phong || option.label || option.id}
              </label>
            </div>
          ))}
          {options.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground italic">
              Không có dữ liệu
            </p>
          )}
        </div>
        {renderError()}
      </div>
    );
  }

  // 7. DEFAULT TEXT
  return (
    <div className="space-y-2">
      <Label htmlFor={param.name} className={cn(error && "text-destructive")}>
        {param.label || param.name}
        {renderRequiredIndicator()}
      </Label>
      <Input
        id={param.name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Nhập ${param.label || param.name}`}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {renderError()}
    </div>
  );
}
