'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loading({ 
  className, 
  text = 'Đang tải...', 
  fullScreen = false,
  size = 'default' 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center py-8';

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 
          className={cn(
            'animate-spin text-primary',
            sizeClasses[size]
          )} 
        />
        {text && (
          <p className="text-sm font-medium text-muted-foreground">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
