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
import { Loader2 } from "lucide-react";

export function DynamicParameterInput({ param, value, onChange }) {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Admin mapping types
  const displayType = param.loai_hien_thi || detectParamType(param.ten_tham_so);

  useEffect(() => {
    if (displayType === "ROOM_SELECT") {
      fetchOptions("/api/rooms");
    } else if (param.nguon_du_lieu) {
      fetchOptions(param.nguon_du_lieu);
    }
  }, [displayType, param.nguon_du_lieu]);

  async function fetchOptions(url) {
    try {
      setIsLoading(true);
      const res = await fetch(url);
      const data = await res.json();

      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.success) {
        items = data.data || data.rooms || data.tenants || data.contracts || [];
      }

      setOptions(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching options:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // 1. DATE PICKER
  if (displayType === "DATE") {
    return (
      <div className="space-y-2">
        <Label htmlFor={param.ten_tham_so}>
          {param.nhan || param.ten_tham_so}
        </Label>
        <Input
          id={param.ten_tham_so}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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
        <Label htmlFor={param.ten_tham_so}>
          {param.nhan || param.ten_tham_so}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={param.ten_tham_so}>
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
      </div>
    );
  }

  // 3. YEAR SELECT
  if (displayType === "YEAR_SELECT") {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => ({
      id: (currentYear - 5 + i).toString(),
      label: `Năm ${currentYear - 5 + i}`,
    }));
    return (
      <div className="space-y-2">
        <Label htmlFor={param.ten_tham_so}>
          {param.nhan || param.ten_tham_so}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={param.ten_tham_so}>
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
      </div>
    );
  }

  // 4. ROOM SELECT (Dynamic)
  if (displayType === "ROOM_SELECT" || options.length > 0 || isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor={param.ten_tham_so}>
          {param.nhan || param.ten_tham_so}
        </Label>
        {isLoading ? (
          <div className="flex items-center justify-center h-10 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={param.ten_tham_so}>
              <SelectValue
                placeholder={`Chọn ${param.nhan || param.ten_tham_so}`}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.ten_phong ||
                    option.ten ||
                    option.ten_hien_thi ||
                    option.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  // 5. NUMBER
  if (displayType === "NUMBER") {
    return (
      <div className="space-y-2">
        <Label htmlFor={param.ten_tham_so}>
          {param.nhan || param.ten_tham_so}
        </Label>
        <Input
          id={param.ten_tham_so}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  // 6. DEFAULT TEXT
  return (
    <div className="space-y-2">
      <Label htmlFor={param.ten_tham_so}>
        {param.nhan || param.ten_tham_so}
      </Label>
      <Input
        id={param.ten_tham_so}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Nhập ${param.nhan || param.ten_tham_so}`}
      />
    </div>
  );
}

function detectParamType(paramName) {
  if (paramName.includes("ngay") || paramName.includes("date")) return "DATE";
  if (paramName.includes("phong") || paramName === "p_phong")
    return "ROOM_SELECT";
  return "TEXT";
}
