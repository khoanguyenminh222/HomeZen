'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { User, ArrowRight, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';

// Validation schema
const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { config } = useWebsiteConfig();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Auto focus vào input username khi vào trang
  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        setTimeout(() => {
          setFocus('username');
        }, 100);
      } else {
        setSuccess(true);
        setSuccessMessage(result.message || 'Yêu cầu đã được gửi thành công!');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      setTimeout(() => {
        setFocus('username');
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex bg-background overflow-hidden relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Background Decor - Ambient Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 z-0" />

      {/* Left Column: Branding & Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-muted/30 items-center justify-center p-12 overflow-hidden border-r border-border">
        {/* Decorative Circles */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/20 rounded-full animate-pulse delay-500" />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4" />
              Quên Mật Khẩu
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-tight text-foreground">
              Khôi Phục <br />
              <span className="text-primary italic text-2xl">Mật Khẩu</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Nhập tên đăng nhập của bạn để nhận liên kết đặt lại mật khẩu. Chúng tôi sẽ gửi hướng dẫn đến bạn.
            </p>
          </div>

          <div className="relative w-full aspect-square max-w-sm mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Mail className="w-32 h-32 text-primary/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="lg:hidden text-center space-y-2 mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 overflow-hidden relative">
              <OptimizedImage
                src={config?.logoUrl || '/images/home-zen-logo.png'}
                alt={`${config?.brandName || 'HomeZen'} Logo`}
                fill
                className="object-contain p-3"
              />
            </div>
            <h2 className="text-3xl font-black text-foreground tracing-tight">{config?.brandName || 'HomeZen'}</h2>
            <p className="text-muted-foreground">Khôi phục mật khẩu</p>
          </div>

          <div className="space-y-2 lg:block hidden">
            <h2 className="text-3xl font-black tracking-tight text-foreground italic">
              Quên Mật Khẩu
            </h2>
            <p className="text-muted-foreground">
              Nhập tên đăng nhập để nhận liên kết đặt lại mật khẩu
            </p>
          </div>

          {success ? (
            <div className="space-y-6 pt-2">
              <div className="p-6 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold">Yêu cầu đã được gửi thành công!</p>
                    <p className="text-muted-foreground">
                      {successMessage || (
                        <>
                          Nếu tên đăng nhập tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu. 
                          {config?.contactEmail || config?.contactPhone ? (
                            <> Vui lòng kiểm tra email hoặc liên hệ{' '}
                              {config.contactEmail && (
                                <a href={`mailto:${config.contactEmail}`} className="text-primary hover:underline font-medium">
                                  {config.contactEmail}
                                </a>
                              )}
                              {config.contactEmail && config.contactPhone && ' / '}
                              {config.contactPhone && (
                                <a href={`tel:${config.contactPhone}`} className="text-primary hover:underline font-medium">
                                  {config.contactPhone}
                                </a>
                              )}
                              {' '}để được hỗ trợ.
                            </>
                          ) : (
                            ' Vui lòng kiểm tra email hoặc liên hệ quản trị viên để được hỗ trợ.'
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
              <div className="space-y-5">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold ml-1">
                    Tên đăng nhập
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <User className="size-5" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Nhập tên đăng nhập"
                      {...register('username')}
                      disabled={isLoading}
                      className="h-14 pl-12 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs font-semibold text-destructive ml-1">
                      {errors.username.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 text-sm font-medium text-destructive bg-destructive/5 border border-destructive/10 rounded-2xl animate-in fade-in slide-in-from-left-2 duration-300">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-2xl transition-all group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Gửi yêu cầu
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="pt-6 relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border/50" />
            <span className="relative z-10 px-4 mx-auto text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest block w-fit">
              Hoặc
            </span>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>

          <p className="text-[10px] text-center text-muted-foreground/50 pt-8 uppercase tracking-tighter">
            {config?.footerText || 'HomeZen — Boarding House Management v1.0'}
          </p>
        </div>
      </div>
    </div>
  );
}
