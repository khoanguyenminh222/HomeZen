// components/ui/DynamicLogo.jsx
'use client';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';

/**
 * DynamicLogo component
 * Displays logo and brand name from website configuration
 */
export function DynamicLogo({ size = 32, showText = true, className = '' }) {
  const { config } = useWebsiteConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center shrink-0">
        <OptimizedImage
          src={config?.logoUrl || '/images/home-zen-logo.png'}
          alt={`${config?.brandName || 'HomeZen'} Logo`}
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      {showText && (
        <h1 className="text-xl font-bold text-card-foreground hidden xs:block">
          {config?.brandName || 'HomeZen'}
        </h1>
      )}
    </div>
  );
}
