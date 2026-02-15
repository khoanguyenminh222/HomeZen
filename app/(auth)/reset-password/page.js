'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';

// Validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config } = useWebsiteConfig();
  const token = searchParams.get('token');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Validate token khi component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.');
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        const result = await response.json();

        if (!response.ok || !result.valid) {
          setError(result.error || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Không thể xác thực token. Vui lòng thử lại.');
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  // Auto focus vào input password khi token hợp lệ
  useEffect(() => {
    if (tokenValid && !isValidatingToken) {
      setTimeout(() => {
        setFocus('password');
      }, 100);
    }
  }, [tokenValid, isValidatingToken, setFocus]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        setTimeout(() => {
          setFocus('password');
        }, 100);
      } else {
        setSuccess(true);
        // Redirect về login sau 3 giây
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      setTimeout(() => {
        setFocus('password');
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-dvh flex bg-background overflow-hidden relative items-center justify-center">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-muted-foreground">Đang xác thực token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-dvh flex bg-background overflow-hidden relative">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-destructive/20">
                <ShieldCheck className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Token không hợp lệ</h2>
              {error && (
                <p className="text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-2xl p-4">
                  {error}
                </p>
              )}
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/forgot-password')}
                  className="w-full h-14 text-base font-bold rounded-2xl"
                >
                  <span className="flex items-center gap-2">
                    Yêu cầu đặt lại mật khẩu mới
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh flex bg-background overflow-hidden relative">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Đặt lại mật khẩu thành công!</h2>
              <p className="text-muted-foreground">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-14 text-base font-bold rounded-2xl"
                >
                  <span className="flex items-center gap-2">
                    Đi đến đăng nhập
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Đặt Lại Mật Khẩu
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-tight text-foreground">
              Đặt Lại <br />
              <span className="text-primary italic text-2xl">Mật Khẩu</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Nhập mật khẩu mới của bạn để hoàn tất quá trình đặt lại mật khẩu. Mật khẩu phải có ít nhất 6 ký tự.
            </p>
          </div>

          <div className="relative w-full aspect-square max-w-sm mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-32 h-32 text-primary/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Reset Password Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="lg:hidden text-center space-y-2 mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 overflow-hidden relative">
              <OptimizedImage
                src={config?.logo_url || '/images/home-zen-logo.png'}
                alt={`${config?.ten_thuong_hieu || 'HomeZen'} Logo`}
                fill
                className="object-contain p-3"
              />
            </div>
            <h2 className="text-3xl font-black text-foreground tracing-tight">{config?.ten_thuong_hieu || 'HomeZen'}</h2>
            <p className="text-muted-foreground">Đặt lại mật khẩu</p>
          </div>

          <div className="space-y-2 lg:block hidden">
            <h2 className="text-3xl font-black tracking-tight text-foreground italic">
              Đặt Lại Mật Khẩu
            </h2>
            <p className="text-muted-foreground">
              Nhập mật khẩu mới của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <div className="space-y-5">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold ml-1">
                  Mật khẩu mới
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="size-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    {...register('password')}
                    disabled={isLoading}
                    className="h-14 pl-12 pr-12 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-semibold text-destructive ml-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold ml-1">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="size-5" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                    className="h-14 pl-12 pr-12 bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs font-semibold text-destructive ml-1">
                    {errors.confirmPassword.message}
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
                  Đặt lại mật khẩu
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

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
            {config?.tieu_de_footer || 'HomeZen — Boarding House Management v1.0'}
          </p>
        </div>
      </div>
    </div>
  );
}
