// components/ui/DynamicMetadata.jsx
'use client';
import { useEffect } from 'react';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';

/**
 * DynamicMetadata component
 * Updates document title and meta tags dynamically
 */
export function DynamicMetadata() {
  const { config, loading } = useWebsiteConfig();

  useEffect(() => {
    if (!loading && config) {
      const title = config.websiteTitle || 'HomeZen - Ứng dụng quản lý nhà trọ';
      const description = config.websiteDescription || 'Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại';

      // 1. Update Title
      if (document.title !== title) {
        document.title = title;
      }
      const titleElement = document.querySelector('title');
      if (titleElement && titleElement.textContent !== title) {
        titleElement.textContent = title;
      }

      // 2. Update Meta Description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      if (metaDescription.getAttribute('content') !== description) {
        metaDescription.setAttribute('content', description);
      }

      // 3. Update Favicon
      const faviconUrl = config.faviconUrl && config.faviconUrl.trim() !== ''
        ? config.faviconUrl
        : '/images/favicon.ico';

      // Always use aggressive cache buster for tab browser to force refresh
      const version = config.updatedAt ? new Date(config.updatedAt).getTime() : Date.now();
      const finalFaviconUrl = faviconUrl.startsWith('data:')
        ? faviconUrl
        : `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${version}&t=${Date.now()}`;

      const iconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]'
      ];

      iconSelectors.forEach(selector => {
        let link = document.querySelector(selector);
        if (!link) {
          link = document.createElement('link');
          link.rel = selector.split('"')[1];
          document.head.appendChild(link);
        }

        link.href = finalFaviconUrl;

        if (faviconUrl.startsWith('data:')) {
          const match = faviconUrl.match(/^data:([^;]+);/);
          if (match) link.type = match[1];
        } else {
          const urlPath = faviconUrl.split('?')[0].toLowerCase();
          if (urlPath.endsWith('.svg')) link.type = 'image/svg+xml';
          else if (urlPath.endsWith('.png')) link.type = 'image/png';
          else link.type = 'image/x-icon';
        }
      });
    }
  }, [config, loading]);

  return null;
}
