"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Users, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ReportPermissionManager() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      fetchTemplatePermissions();
    }
  }, [selectedTemplateId]);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates?limit=100");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users/list-for-select");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async function fetchTemplatePermissions() {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/admin/templates/${selectedTemplateId}/permissions`,
      );
      const data = await res.json();
      if (data.success) {
        const permissions = data.data.phan_quyen;
        setSelectedUserIds(permissions?.users || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedTemplateId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn mẫu báo cáo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(
        `/api/admin/templates/${selectedTemplateId}/permissions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedUserIds }),
        },
      );

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật phân quyền",
          variant: "success",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật phân quyền",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function toggleUser(userId) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      user.tai_khoan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ten_hien_thi.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chọn Mẫu Báo Cáo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn mẫu báo cáo..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.ten}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplateId && (
            <div className="text-sm text-muted-foreground">
              Đã chọn:{" "}
              <span className="font-medium">
                {templates.find((t) => t.id === selectedTemplateId)?.ten}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Phân Quyền Cho Người Dùng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedTemplateId ? (
            <div className="text-center py-12 text-muted-foreground">
              Vui lòng chọn mẫu báo cáo bên trái
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent"
                  >
                    <Checkbox
                      id={user.id}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <Label htmlFor={user.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{user.ten_hien_thi}</div>
                      <div className="text-xs text-muted-foreground">
                        @{user.tai_khoan}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-4">
                  Đã chọn: {selectedUserIds.length} người dùng
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu Phân Quyền
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
