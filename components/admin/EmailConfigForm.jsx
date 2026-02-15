"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmailConfigSchema } from "@/lib/validations/notification-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import { Mail, CheckCircle2, XCircle, Eye, EyeOff, Send } from "lucide-react";

/**
 * Email Configuration Form
 * Cho phép Super Admin cấu hình SMTP email
 * Requirements: 1.1, 1.3
 */
export default function EmailConfigForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(createEmailConfigSchema),
    defaultValues: {
      smtp_host: "",
      smtp_port: 587,
      smtp_user: "",
      smtp_password: "",
      ten_nguoi_gui: "",
      su_dung_tls: true,
      su_dung_ssl: false,
    },
  });

  const su_dung_tls = watch("su_dung_tls");
  const su_dung_ssl = watch("su_dung_ssl");

  // Fetch cấu hình email hiện tại
  useEffect(() => {
    async function fetchEmailConfig() {
      try {
        // Lấy config đã decrypt (có password) để hiển thị
        const response = await fetch("/api/admin/email-config?decrypted=true");
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setConfigId(result.data.id);
            // Hiển thị các thông tin đã lưu (bao gồm password)
            reset({
              smtp_host: result.data.smtp_host || "",
              smtp_port: result.data.smtp_port || 587,
              smtp_user: result.data.smtp_user || "",
              smtp_password: result.data.smtp_password || "", // Hiển thị password đã lưu
              ten_nguoi_gui: result.data.ten_nguoi_gui || "",
              su_dung_tls: result.data.su_dung_tls ?? true,
              su_dung_ssl: result.data.su_dung_ssl ?? false,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching email config:", error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchEmailConfig();
  }, [reset]);

  const onTestConnection = async () => {
    const formData = watch();
    // Kiểm tra xem form có đủ thông tin không
    const hasCompleteFormData =
      formData.smtp_host &&
      formData.smtp_port &&
      formData.smtp_user &&
      formData.smtp_password;

    let requestBody;
    if (!hasCompleteFormData) {
      // Nếu không có đủ thông tin, API sẽ tự lấy từ DB
      requestBody = {};
    } else {
      // Normalize SMTP host
      const smtp_host = formData.smtp_host.trim().toLowerCase();
      const normalizedFormData = {
        ...formData,
        smtp_host:
          smtp_host === "gmail" ? "smtp.gmail.com" : formData.smtp_host.trim(),
      };

      // Cập nhật form value nếu đã normalize
      if (smtp_host === "gmail") {
        setValue("smtp_host", "smtp.gmail.com", { shouldValidate: true });
      }

      requestBody = normalizedFormData;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Thành công",
          description: "Kết nối SMTP thành công!",
          variant: "success",
        });
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể kết nối SMTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test connection error:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi test kết nối",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSendTestEmail = async () => {
    if (!testEmail || !testEmail.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email để gửi test",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail.trim())) {
      toast({
        title: "Lỗi",
        description: "Email không hợp lệ. Vui lòng nhập đúng định dạng email.",
        variant: "destructive",
      });
      return;
    }

    const formData = watch();
    // Kiểm tra xem form có đủ thông tin không
    const hasCompleteFormData =
      formData.smtp_host &&
      formData.smtp_port &&
      formData.smtp_user &&
      formData.smtp_password;

    // Nếu không có đủ thông tin trong form, sử dụng config đã lưu trong DB
    const useSavedConfig = !hasCompleteFormData;

    let requestBody;
    if (useSavedConfig) {
      // Gửi request với flag useSavedConfig để API tự lấy từ DB
      requestBody = {
        testEmail: testEmail.trim(),
        useSavedConfig: true,
      };
    } else {
      // Normalize SMTP host
      const smtp_host = formData.smtp_host.trim().toLowerCase();
      const normalizedFormData = {
        ...formData,
        smtp_host:
          smtp_host === "gmail" ? "smtp.gmail.com" : formData.smtp_host.trim(),
      };

      // Cập nhật form value nếu đã normalize
      if (smtp_host === "gmail") {
        setValue("smtp_host", "smtp.gmail.com", { shouldValidate: true });
      }

      requestBody = {
        ...normalizedFormData,
        testEmail: testEmail.trim(),
      };
    }

    setIsSendingTest(true);
    try {
      const response = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Thành công",
          description:
            result.message || `Email test đã được gửi đến ${testEmail.trim()}`,
          variant: "success",
        });
        setTestEmail(""); // Clear email input after success
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể gửi email test",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Send test email error:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi gửi email test",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Normalize SMTP host trước khi test
      let normalizedData = { ...data };
      const smtp_host = data.smtp_host.trim().toLowerCase();
      if (smtp_host === "gmail") {
        normalizedData.smtp_host = "smtp.gmail.com";
        // Cập nhật form value để user thấy giá trị đã normalize
        setValue("smtp_host", "smtp.gmail.com", { shouldValidate: true });
      }

      // Test connection trước khi lưu
      const testResponse = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedData),
      });

      const testResult = await testResponse.json();

      if (!testResponse.ok || !testResult.success) {
        toast({
          title: "Lỗi",
          description:
            testResult.error ||
            "Không thể kết nối SMTP. Vui lòng kiểm tra lại cấu hình.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Lưu hoặc cập nhật cấu hình
      const url = configId
        ? `/api/admin/email-config`
        : "/api/admin/email-config";
      const method = configId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(configId && { id: configId }),
          ...normalizedData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description:
            result.message || "Cấu hình email đã được lưu thành công!",
          variant: "success",
        });
        if (result.data?.id) {
          setConfigId(result.data.id);
        }
        // Fetch lại config để hiển thị password đã lưu
        const refreshResponse = await fetch(
          "/api/admin/email-config?decrypted=true",
        );
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.data) {
            setValue("smtp_password", refreshResult.data.smtp_password || "");
          }
        }
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Save email config error:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!configId) {
      toast({
        title: "Lỗi",
        description: "Không có cấu hình để xóa",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình email?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/email-config/${configId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description:
            result.message || "Cấu hình email đã được xóa thành công!",
          variant: "success",
        });
        setConfigId(null);
        reset({
          smtp_host: "",
          smtp_port: 587,
          smtp_user: "",
          smtp_password: "",
          ten_nguoi_gui: "",
          su_dung_tls: true,
          su_dung_ssl: false,
        });
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete email config error:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <Loading text="Đang tải cấu hình email..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Cấu Hình Email SMTP
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Cấu hình SMTP để gửi email reset mật khẩu và các thông báo khác.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* SMTP Host */}
            <div className="space-y-2">
              <Label htmlFor="smtp_host" className="text-sm sm:text-base">
                SMTP Host <span className="text-red-500">*</span>
              </Label>
              <Input
                id="smtp_host"
                type="text"
                placeholder="VD: smtp.gmail.com"
                {...register("smtp_host", {
                  onBlur: (e) => {
                    // Tự động thêm "smtp." nếu user nhập "gmail"
                    const value = e.target.value.trim().toLowerCase();
                    if (value === "gmail") {
                      setValue("smtp_host", "smtp.gmail.com", {
                        shouldValidate: true,
                      });
                    }
                  },
                  // Đảm bảo không tự động thay đổi khi fromEmail thay đổi
                  onChange: (e) => {
                    // Không làm gì cả - giữ smtp_host và fromEmail hoàn toàn độc lập
                  },
                })}
              />
              {errors.smtp_host && (
                <p className="text-sm text-red-500">
                  {errors.smtp_host.message}
                </p>
              )}
            </div>

            {/* SMTP Port */}
            <div className="space-y-2">
              <Label htmlFor="smtp_port" className="text-sm sm:text-base">
                SMTP Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="smtp_port"
                type="number"
                placeholder="VD: 587"
                {...register("smtp_port", { valueAsNumber: true })}
              />
              {errors.smtp_port && (
                <p className="text-sm text-red-500">
                  {errors.smtp_port.message}
                </p>
              )}
            </div>

            {/* SMTP User */}
            <div className="space-y-2">
              <Label htmlFor="smtp_user" className="text-sm sm:text-base">
                SMTP Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="smtp_user"
                type="text"
                placeholder="VD: your-email@gmail.com"
                {...register("smtp_user")}
              />
              {errors.smtp_user && (
                <p className="text-sm text-red-500">
                  {errors.smtp_user.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Email này sẽ được sử dụng làm email người gửi (From Email) khi
                gửi email.
              </p>
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label htmlFor="smtp_password" className="text-sm sm:text-base">
                SMTP Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu SMTP"
                  {...register("smtp_password")}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.smtp_password && (
                <p className="text-sm text-red-500">
                  {errors.smtp_password.message}
                </p>
              )}
            </div>

            {/* From Name */}
            <div className="space-y-2">
              <Label htmlFor="ten_nguoi_gui" className="text-sm sm:text-base">
                Tên Người Gửi (Tùy chọn)
              </Label>
              <Input
                id="ten_nguoi_gui"
                type="text"
                placeholder="VD: HomeZen"
                {...register("ten_nguoi_gui")}
              />
              {errors.ten_nguoi_gui && (
                <p className="text-sm text-red-500">
                  {errors.ten_nguoi_gui.message}
                </p>
              )}
            </div>

            {/* Use TLS */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="su_dung_tls" className="text-sm sm:text-base">
                  Sử dụng TLS
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bật TLS cho kết nối bảo mật (khuyến nghị)
                </p>
              </div>
              <Switch
                id="su_dung_tls"
                checked={su_dung_tls}
                onCheckedChange={(checked) => setValue("su_dung_tls", checked)}
              />
            </div>

            {/* Use SSL */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="su_dung_ssl" className="text-sm sm:text-base">
                  Sử dụng SSL
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bật SSL cho port 465 (thường không cần nếu đã bật TLS)
                </p>
              </div>
              <Switch
                id="su_dung_ssl"
                checked={su_dung_ssl}
                onCheckedChange={(checked) => setValue("su_dung_ssl", checked)}
              />
            </div>

            {/* Test Email Section */}
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="testEmail" className="text-sm sm:text-base">
                  Email Test (Gửi thử email)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="VD: test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={isSendingTest || isLoading || isTesting}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSendTestEmail}
                    disabled={isSendingTest || isLoading || isTesting}
                  >
                    {isSendingTest ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Gửi Test
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nhập email để gửi email test và kiểm tra cấu hình SMTP.
                  {configId && (
                    <span className="block mt-1">
                      💡 Nếu form chưa điền đầy đủ, hệ thống sẽ tự động sử dụng
                      cấu hình đã lưu trong database.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onTestConnection}
                disabled={isTesting || isLoading || isSendingTest}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                    Đang test...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test Kết Nối
                  </>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading || isTesting}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {configId ? "Cập Nhật" : "Lưu"} Cấu Hình
                  </>
                )}
              </Button>
              {configId && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isLoading || isTesting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
