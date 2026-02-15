"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTelegramConfigSchema } from "@/lib/validations/notification-config";
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
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import { Send, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

/**
 * Telegram Configuration Form
 * Cho phép Property Owner cấu hình Telegram bot
 * Requirements: 2.1, 2.3
 */
export default function TelegramConfigForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [showChatId, setShowChatId] = useState(false);
  const [botUsername, setBotUsername] = useState(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(createTelegramConfigSchema),
    defaultValues: {
      chat_id: "",
    },
  });

  const chat_id = watch("chat_id");

  // Fetch cấu hình telegram hiện tại
  useEffect(() => {
    async function fetchTelegramConfig() {
      try {
        // Lấy config đã decrypt để hiển thị chatId
        const response = await fetch("/api/telegram-config?decrypted=true");
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            // Hiển thị chatId đã được decrypt
            reset({
              chat_id: result.data.chat_id || "",
            });
            // Lưu botUsername để hiển thị gợi ý
            if (result.data.ten_bot) {
              setBotUsername(result.data.ten_bot);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching telegram config:", error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchTelegramConfig();
  }, [reset]);

  const onTestConnection = async () => {
    if (!chat_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập Chat ID trước khi test",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/telegram-config/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Thành công",
          description: "Kết nối Telegram bot thành công!",
          variant: "success",
        });
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể kết nối Telegram bot",
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

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Lưu cấu hình (service sẽ tự động test connection khi lưu)
      const response = await fetch("/api/telegram-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description:
            result.message || "Cấu hình Telegram đã được lưu thành công!",
          variant: "success",
        });
        // Fetch lại config để hiển thị chat ID đã lưu
        const refreshResponse = await fetch(
          "/api/telegram-config?decrypted=true",
        );
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.data) {
            reset({
              chat_id: refreshResult.data.chat_id || "",
            });
            // Cập nhật botUsername nếu có
            if (refreshResult.data.ten_bot) {
              setBotUsername(refreshResult.data.ten_bot);
            }
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
      console.error("Save telegram config error:", error);
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
    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình Telegram?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/telegram-config", {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description:
            result.message || "Cấu hình Telegram đã được xóa thành công!",
          variant: "success",
        });
        reset({
          chat_id: "",
        });
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Có lỗi xảy ra. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete telegram config error:", error);
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
    return <Loading text="Đang tải cấu hình Telegram..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Send className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="wrap-break-word">Cấu Hình Telegram Bot</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            Cấu hình Chat ID để nhận thông báo tự động qua Telegram. Bot token
            đã được quản trị viên cấu hình.
            {botUsername && (
              <span className="block mt-2 sm:mt-3 font-semibold text-primary text-xs sm:text-sm">
                💡 Bot hiện tại: {botUsername} - Bạn có thể nhắn trực tiếp bot
                hoặc thêm bot vào nhóm để nhận thông báo
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5 sm:space-y-6"
          >
            {/* Chat ID */}
            <div className="space-y-2">
              <Label
                htmlFor="chat_id"
                className="text-sm sm:text-base font-semibold"
              >
                Chat ID <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="chat_id"
                  type={showChatId ? "text" : "password"}
                  placeholder="VD: -1001234567890"
                  {...register("chat_id")}
                  className="h-11 sm:h-10 pr-11 sm:pr-10 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowChatId(!showChatId)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={showChatId ? "Ẩn Chat ID" : "Hiện Chat ID"}
                >
                  {showChatId ? (
                    <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" />
                  ) : (
                    <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
              {errors.chat_id && (
                <p className="text-xs sm:text-sm text-red-500">
                  {errors.chat_id.message}
                </p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Chat ID phải là số (có thể có dấu - ở đầu).
                <span className="block mt-1.5 sm:mt-2">
                  💡 <strong>Nhắn trực tiếp bot:</strong> Bạn không thấy Chat ID
                  trong URL, cần nhắn cho @userinfobot để lấy Chat ID của bạn.
                </span>
                <span className="block mt-1.5 sm:mt-2">
                  💡 <strong>Nhóm:</strong> Thêm bot vào nhóm, sau đó nhắn cho
                  @userinfobot trong nhóm để lấy Chat ID của nhóm.
                </span>
              </p>
            </div>

            {/* Test Connection Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onTestConnection}
                disabled={isTesting || isLoading || !chat_id}
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base"
              >
                {isTesting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                    <span>Đang test...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Test Kết Nối</span>
                    <span className="sm:hidden">Test</span>
                  </>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading || isTesting}
                className="flex-1 h-11 sm:h-10 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full mr-2" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>Lưu Cấu Hình</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isLoading || isTesting}
                className="h-11 sm:h-10 text-sm sm:text-base"
              >
                <XCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Xóa</span>
                <span className="sm:hidden">Xóa</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
