"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Settings2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminParameterConfig({ procedureParams, mapping, onChange }) {
  if (!procedureParams || procedureParams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
        <Info className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Procedure này không có tham số.</p>
      </div>
    );
  }

  const handleParamChange = (paramName, field, value) => {
    const currentParams = mapping.parameters || [];
    const paramIndex = currentParams.findIndex((p) => p.name === paramName);

    const newParams = [...currentParams];
    if (paramIndex >= 0) {
      newParams[paramIndex] = { ...newParams[paramIndex], [field]: value };
    } else {
      // If doesn't exist, create it with defaults
      const procParam = procedureParams.find((p) => p.name === paramName);
      newParams.push({
        name: paramName,
        label: paramName,
        displayType: "TEXT",
        required: false,
        defaultValue: "",
        [field]: value,
      });
    }

    onChange({ ...mapping, parameters: newParams });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold mb-4">
        <Settings2 className="h-4 w-4" />
        <h4>Cấu hình hiển thị tham số</h4>
      </div>

      <div className="space-y-4">
        {procedureParams
          .filter((p) => p.name !== "p_uid")
          .map((procParam) => {
            const config = (mapping.parameters || []).find(
              (p) => p.name === procParam.name,
            ) || {
              name: procParam.name,
              label: procParam.name,
              displayType: "TEXT",
              required: false,
              defaultValue: "",
            };

            return (
              <Card
                key={procParam.name}
                className="overflow-hidden border-border bg-muted/30"
              >
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">
                      {procParam.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`${procParam.name}-req`}
                        className="text-xs"
                      >
                        Bắt buộc
                      </Label>
                      <Switch
                        id={`${procParam.name}-req`}
                        checked={config.required}
                        onCheckedChange={(val) =>
                          handleParamChange(procParam.name, "required", val)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase">
                        Nhãn hiển thị
                      </Label>
                      <Input
                        value={config.label}
                        onChange={(e) =>
                          handleParamChange(
                            procParam.name,
                            "label",
                            e.target.value,
                          )
                        }
                        className="h-8 text-sm"
                        placeholder="VD: Ngày bắt đầu"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase">
                        Loại hiển thị
                      </Label>
                      <Select
                        value={config.displayType}
                        onValueChange={(val) =>
                          handleParamChange(procParam.name, "displayType", val)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEXT">Văn bản (Text)</SelectItem>
                          <SelectItem value="NUMBER">Số (Number)</SelectItem>
                          <SelectItem value="DATE">Ngày (Date)</SelectItem>
                          <SelectItem value="MONTH_SELECT">
                            Chọn tháng
                          </SelectItem>
                          <SelectItem value="YEAR_SELECT">Chọn năm</SelectItem>
                          <SelectItem value="ROOM_SELECT">
                            Chọn phòng (Phòng ID)
                          </SelectItem>
                          <SelectItem value="MULTI_SELECT">
                            Chọn nhiều
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase">
                      Giá trị mặc định (Keyword hoặc Giá trị)
                    </Label>
                    <Select
                      value={config.defaultValue}
                      onValueChange={(val) =>
                        handleParamChange(procParam.name, "defaultValue", val)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Chọn hoặc nhập..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODAY">Hôm nay (TODAY)</SelectItem>
                        <SelectItem value="FIRST_DAY_OF_MONTH">
                          Đầu tháng (FIRST_DAY_OF_MONTH)
                        </SelectItem>
                        <SelectItem value="LAST_DAY_OF_MONTH">
                          Cuối tháng (LAST_DAY_OF_MONTH)
                        </SelectItem>
                        <SelectItem value="CURRENT_MONTH">
                          Tháng hiện tại
                        </SelectItem>
                        <SelectItem value="CURRENT_YEAR">
                          Năm hiện tại
                        </SelectItem>
                        <SelectItem value="none">Không có</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nguồn dữ liệu cho các loại Select/Multi-select */}
                  {(config.displayType === "ROOM_SELECT" ||
                    config.displayType === "MULTI_SELECT") && (
                    <div className="pt-2 border-t border-dashed space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                        <Settings2 className="h-3 w-3" />
                        Cấu hình nguồn dữ liệu
                      </Label>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">API Endpoint</Label>
                        <div className="flex gap-2">
                          <Input
                            value={config.metadata?.dataSource || ""}
                            onChange={(e) => {
                              const meta = config.metadata || {};
                              handleParamChange(procParam.name, "metadata", {
                                ...meta,
                                dataSource: e.target.value,
                              });
                            }}
                            className="h-8 text-sm flex-1"
                            placeholder="/api/rooms/list"
                          />
                          <Select
                            onValueChange={(val) => {
                              const meta = config.metadata || {};
                              handleParamChange(procParam.name, "metadata", {
                                ...meta,
                                dataSource: val,
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 w-24 text-[10px]">
                              <SelectValue placeholder="Mẫu" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="/api/rooms/list">
                                Danh sách phòng
                              </SelectItem>
                              <SelectItem value="/api/users/list">
                                Nhân viên
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                          Nhập đường dẫn API trả về danh sách có {`{id, ten}`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
