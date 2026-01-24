'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, User, Lock, ArrowRight, Home, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Check for error messages from URL parameters (from middleware redirects)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      const errorMessages = {
        'User not found': 'Tài khoản không tồn tại trong hệ thống',
        'Account deactivated': 'Tài khoản đã bị vô hiệu hóa',
        'Session expired': 'Phiên đăng nhập đã hết hạn',
        'Database error during validation': 'Lỗi hệ thống, vui lòng thử lại sau'
      };
      setError(errorMessages[urlError] || urlError);
    }
  }, [searchParams]);

  // Auto focus vào input username khi vào trang
  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  // Auto focus vào input username khi có lỗi
  useEffect(() => {
    if (error && !isLoading) {
      // Delay nhỏ để đảm bảo error message đã được render
      const timer = setTimeout(() => {
        setFocus('username');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading, setFocus]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // Bước 1: Validate login credentials trước
      const validateResponse = await fetch('/api/auth/validate-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const validateResult = await validateResponse.json();

      // Nếu validation thất bại, hiển thị error message cụ thể
      if (!validateResponse.ok || !validateResult.success) {
        setError(validateResult.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        setIsLoading(false);
        // Delay nhỏ để đảm bảo DOM đã cập nhật trước khi focus
        setTimeout(() => {
          setFocus('username');
        }, 100);
        return;
      }

      // Bước 2: Nếu validation thành công, gọi NextAuth signIn
      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Nếu NextAuth vẫn trả về error (trường hợp hiếm), hiển thị error message
        setError('Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.');
        // Delay nhỏ để đảm bảo DOM đã cập nhật trước khi focus
        setTimeout(() => {
          setFocus('username');
        }, 100);
      } else if (result?.ok) {
        // Role-based redirect
        // TODO: Đổi sang super admin dashboard khi có route riêng
        // Lưu ý: Phải fetch user role; ở đây có thể getSession/get user info, nhưng vì đây chỉ là xử lý sau signIn, ta tạm dùng localStorage/sessionStorage lưu role khi validate thành công
        // Tuy nhiên, nếu muốn chuẩn xác, ta nên dùng session hoặc fetch lại user
        
        // Lấy role từ validateResult nếu response trả về, fallback sang lấy từ session nếu cần
        // Giả sử validateResult.role có trả về từ API (nếu không, sẽ cần fetch lại session sau này)
        const role = validateResult.role; // API /api/auth/validate-login phải trả về role mới hoạt động
        if (role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      // Delay nhỏ để đảm bảo DOM đã cập nhật trước khi focus
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
              Secure Login System
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-tight text-foreground">
              Chào Mừng Đến Với <br />
              <span className="text-primary italic">HomeZen</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Giải pháp quản lý nhà trọ thảnh thơi và hiệu quả nhất. Đăng nhập để bắt đầu hành trình của bạn.
            </p>
          </div>

          <div className="relative w-full aspect-square max-w-sm mx-auto">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75 animate-pulse" />
            <Image
              src="/images/home-zen-master-removebg-preview.png"
              alt="HomeZen Master Visual"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          <div className="pt-8 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold">1k+</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Tin cậy</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">99%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Hài lòng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="lg:hidden text-center space-y-2 mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 overflow-hidden relative">
              <Image
                src="/images/home-zen-logo.png"
                alt="HomeZen Logo"
                fill
                className="object-contain p-3"
              />
            </div>
            <h2 className="text-3xl font-black text-foreground tracing-tight">HomeZen</h2>
            <p className="text-muted-foreground">Đăng nhập vào hệ thống quản lý</p>
          </div>

          <div className="space-y-2 lg:block hidden">
            <h2 className="text-3xl font-black tracking-tight text-foreground italic">
              Đăng Nhập
            </h2>
            <p className="text-muted-foreground">Vui lòng nhập thông tin để truy cập hệ thống</p>
          </div>

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

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Mật khẩu
                  </Label>
                  <Link href="#" className="text-xs text-primary hover:underline font-medium" tabIndex={-1}>Quên mật khẩu?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="size-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
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
                  Đăng Nhập
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-6 relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border/50" />
            <span className="relative z-10 bg-background px-4 mx-auto text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest block w-fit">
              Liên hệ hỗ trợ
            </span>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link href="#" className="font-bold text-primary hover:underline">Liên hệ Admin</Link>
            </p>
          </div>

          <p className="text-[10px] text-center text-muted-foreground/50 pt-8 uppercase tracking-tighter">
            HomeZen — Boarding House Management v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
