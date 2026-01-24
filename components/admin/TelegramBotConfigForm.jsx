'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { telegramBotTokenSchema } from '@/lib/validations/notification-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Send, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Telegram Bot Token Configuration Form
 * Cho phép Super Admin cấu hình bot token global
 */
export default function TelegramBotConfigForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [configId, setConfigId] = useState(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(telegramBotTokenSchema),
    defaultValues: {
      botToken: '',
      botUsername: '',
    },
  });

  const botToken = watch('botToken');

  // Fetch cấu hình bot token hiện tại
  useEffect(() => {
    async function fetchBotConfig() {
      try {
        // Lấy config đã decrypt để hiển thị bot token
        const response = await fetch('/api/admin/telegram-bot-config?decrypted=true');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setConfigId(result.data.id);
            // Hiển thị bot token và bot username đã lưu
            reset({
              botToken: result.data.botToken || '',
              botUsername: result.data.botUsername || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching telegram bot config:', error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchBotConfig();
  }, [reset]);

  const onTestConnection = async () => {
    if (!botToken) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập Bot Token trước khi test',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/telegram-bot-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botToken }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Thành công',
          description: 'Bot token hợp lệ!',
          variant: 'success',
        });
        // Tự động điền bot username nếu có từ API
        if (result.botInfo?.username) {
          const botUsername = result.botInfo.username.startsWith('@') 
            ? result.botInfo.username 
            : `@${result.botInfo.username}`;
          setValue('botUsername', botUsername);
        }
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Bot token không hợp lệ',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi test bot token',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      // Lưu bot token (service sẽ tự động test bot token khi lưu)
      const response = await fetch('/api/admin/telegram-bot-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: result.message || 'Bot token đã được lưu thành công!',
          variant: 'success',
        });
        if (result.data?.id) {
          setConfigId(result.data.id);
        }
        // Fetch lại config để hiển thị bot token và bot username đã lưu
        const refreshResponse = await fetch('/api/admin/telegram-bot-config?decrypted=true');
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          if (refreshResult.data) {
            setValue('botToken', refreshResult.data.botToken || '');
            setValue('botUsername', refreshResult.data.botUsername || '');
          }
        }
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Có lỗi xảy ra. Vui lòng thử lại.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Save telegram bot config error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <Loading text="Đang tải cấu hình bot token..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Send className="h-5 w-5" />
            Cấu Hình Telegram Bot Token
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Cấu hình bot token global cho tất cả property owners. Bot token này sẽ được dùng chung cho tất cả người dùng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Bot Token */}
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-sm sm:text-base">
                Bot Token <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="botToken"
                  type={showBotToken ? 'text' : 'password'}
                  placeholder="VD: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  {...register('botToken')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowBotToken(!showBotToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showBotToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.botToken && (
                <p className="text-sm text-red-500">{errors.botToken.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Lấy Bot Token từ @BotFather trên Telegram. Format: số:chuỗi
              </p>
            </div>

            {/* Bot Username */}
            <div className="space-y-2">
              <Label htmlFor="botUsername" className="text-sm sm:text-base">
                Bot Username (Tùy chọn)
              </Label>
              <Input
                id="botUsername"
                type="text"
                placeholder="VD: @BotHomeZen_bot"
                {...register('botUsername')}
              />
              {errors.botUsername && (
                <p className="text-sm text-red-500">{errors.botUsername.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Username của bot để gợi ý cho người dùng. Sẽ tự động lấy từ Telegram API khi test bot token.
              </p>
            </div>

            {/* Test Connection Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onTestConnection}
                disabled={isTesting || isLoading || !botToken}
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
                    Test Bot Token
                  </>
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={isLoading || isTesting} className="flex-1">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {configId ? 'Cập Nhật' : 'Lưu'} Bot Token
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
