// components/ui/OptimizedImage.jsx
'use client';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { isCloudinaryUrl, extractCloudinaryPublicId } from '@/lib/utils/image-helper';

/**
 * OptimizedImage component
 * Automatically uses CldImage for Cloudinary URLs and Next.js Image for local files
 * Provides auto-format and auto-quality optimization for Cloudinary images
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  priority,
  ...props
}) {
  // Handle empty, null, or undefined src
  if (!src || (typeof src === 'string' && src.trim() === '')) {
    return null;
  }

  // Determine if we should use unoptimized for Next.js Image
  // We use unoptimized for Data URLs, .ico files, and any local files to avoid "received null" errors
  const isDataUrl = typeof src === 'string' && src.startsWith('data:');
  const isIco = typeof src === 'string' && (
    src.toLowerCase().split('?')[0].endsWith('.ico') ||
    src.toLowerCase().includes('favicon')
  );

  const isCloudinary = isCloudinaryUrl(src);
  const hasCloudinaryConfig = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // If it's a Cloudinary URL but config is missing, fallback to Next.js Image
  if (isCloudinary && !hasCloudinaryConfig) {
    console.warn('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. Using Next.js Image instead of CldImage.');
  }

  if (isCloudinary && hasCloudinaryConfig) {
    const publicId = extractCloudinaryPublicId(src);

    if (publicId && publicId !== src && !publicId.includes('http') && !publicId.includes('://')) {
      if (fill) {
        return (
          <CldImage
            src={publicId}
            alt={alt}
            fill
            className={className}
            priority={priority}
            quality="auto"
            format="auto"
            {...props}
          />
        );
      }

      return (
        <CldImage
          src={publicId}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
          quality="auto"
          format="auto"
          {...props}
        />
      );
    }
  }

  // Use Next.js Image for local files or if extraction failed
  const shouldUnoptimize = !isCloudinary || isDataUrl || isIco;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        unoptimized={shouldUnoptimize}
        {...props}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={shouldUnoptimize}
      {...props}
    />
  );
}
