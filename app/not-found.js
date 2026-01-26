'use client';

import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Home, ArrowLeft, Settings, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';

export default function NotFound() {
  const { config } = useWebsiteConfig();
  return (
    <div className="relative min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-4 overflow-hidden">
      {/* Background Decor - Visual Ambient */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 md:w-80 md:h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 md:w-80 md:h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-4 md:space-y-8">
        {/* Illustration Section */}
        <div className="relative animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8">
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 mx-auto">
            {/* Soft Glow behind image */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-75 animate-pulse" />
            <OptimizedImage
              src={config?.heroImageUrl || '/images/home-zen-master-removebg-preview.png'}
              alt={`${config?.brandName || 'HomeZen'} Master Visual`}
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          {/* Floating 404 Text */}
          <div className="absolute -top-1 -right-1 sm:-top-4 sm:right-0 md:right-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border border-border px-3 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl transform rotate-12 animate-bounce">
            <span className="text-xl sm:text-2xl font-black text-primary italic">404</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <div className="space-y-1 md:space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.1]">
              Trang Này Đang <br className="sm:hidden" />
              <span className="text-primary italic">Tìm Tĩnh Lặng</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-md mx-auto leading-relaxed px-4">
              Có vẻ đường dẫn này đã tìm được lối thoát riêng hoặc chưa có. 🧘‍♂️
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 pt-1 sm:pt-4">
            <Button asChild className="w-full sm:w-auto h-11 sm:h-14 px-8 text-sm sm:text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-xl sm:rounded-2xl group">
              <Link href="/">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                Về Trang Chủ
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto h-11 sm:h-14 px-8 text-sm sm:text-base font-medium border-border/50 hover:bg-muted rounded-xl sm:rounded-2xl transition-all"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Quay Lại
            </Button>
          </div>
        </div>

        {/* Quick Links / Footer Suggestion */}
        <div className="pt-4 md:pt-8 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 fill-mode-both">
          <p className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest opacity-70">
            Có thể bạn đang tìm:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Quản lý phòng', href: '/rooms', icon: LayoutGrid },
              { label: 'Cài đặt', href: '/settings/property', icon: Settings },
            ].map((link) => (
              <Button key={link.href} variant="secondary" asChild className="h-8 sm:h-10 rounded-lg sm:rounded-xl px-3 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20">
                <Link href={link.href} className="flex items-center gap-1.5 text-[11px] sm:text-sm font-medium">
                  <link.icon className="size-3 sm:size-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="mt-4 sm:mt-8 opacity-40 px-6">
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
              {config?.footerText || 'HomeZen — Quản lý nhà trọ thảnh thơi.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
