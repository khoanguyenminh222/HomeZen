'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Home, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';

export default function Error({ error, reset }) {
  const { config } = useWebsiteConfig();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6 relative overflow-hidden">
      {/* Absolute Ambient Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 md:space-y-12">
        {/* Illustration Section */}
        <div className="relative animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto">
            {/* Soft Glow behind image */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-75 animate-pulse" />
            <OptimizedImage
              src={config?.anh_loi_url || '/images/home-zen-error.png'}
              alt={`${config?.ten_thuong_hieu || 'HomeZen'} System Error`}
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          {/* Warning Badge */}
          <div className="absolute top-4 right-1/4 bg-destructive/10 backdrop-blur-md border border-destructive/20 p-2 rounded-full shadow-lg animate-bounce duration-2000">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/5 text-destructive border border-destructive/10 text-xs font-bold uppercase tracking-widest mb-2">
              System Alert
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-foreground leading-[1.1]">
              Hệ Thống Đang Cần <br className="sm:hidden" />
              <span className="text-primary italic">Chút Tĩnh Lặng</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
              Đừng lo lắng, chúng tôi đang xử lý để đưa mọi thứ trở lại trạng thái cân bằng. Hãy thử tải lại trang nhé.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={reset}
              className="h-14 px-8 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 min-w-[180px]"
            >
              <RefreshCw className="w-5 h-5 mr-3 animate-spin-slow" />
              Thử Lại Ngay
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-8 text-base font-bold rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-md border-border/50 hover:bg-muted/50 transition-all min-w-[180px]"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-3" />
                Về Trang Chủ
              </Link>
            </Button>
          </div>

          <div className="pt-2 animate-in fade-in duration-700 delay-500 fill-mode-both">
            <p className="text-sm text-muted-foreground font-medium">
              Bạn vẫn gặp sự cố?{' '}
              <Link href="#" className="text-primary font-bold hover:underline transition-all">
                Báo cáo với chúng tôi
              </Link>
            </p>
          </div>
        </div>

        {/* Error Details Section (Expandable) */}
        <div className="pt-8 border-t border-border/50 animate-in fade-in duration-700 delay-500 fill-mode-both">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 mx-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Xem chi tiết kỹ thuật
          </button>

          {showDetails && (
            <div className="mt-4 p-4 rounded-2xl bg-muted/30 border border-border/50 text-left animate-in slide-in-from-top-4 duration-300">
              <p className="font-mono text-[13px] text-destructive leading-relaxed break-all">
                {error.message || 'Lỗi không xác định bí ẩn'}
              </p>
              {error.digest && (
                <p className="mt-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-tighter">
          {config?.tieu_de_footer || 'HomeZen Reliability System — Error Handler 1.0'}
        </p>
      </div>
    </div>
  );
}
