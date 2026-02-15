// contexts/WebsiteConfigContext.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const WebsiteConfigContext = createContext();

/**
 * Default configuration values
 * Used as fallback when API fails
 */
function getDefaultConfig() {
  return {
    id: 'default',
    logo_url: '/images/home-zen-logo.png',
    favicon_url: '/images/favicon.ico',
    anh_hero_url: '/images/home-zen-master-removebg-preview.png',
    anh_loi_url: '/images/home-zen-error.png',
    tieu_de_website: 'HomeZen - Ứng dụng quản lý nhà trọ',
    mo_ta_website: 'Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại',
    ten_thuong_hieu: 'HomeZen',
    tieu_de_hero: 'Chào Mừng Đến Với HomeZen',
    phu_de_hero: 'Quản lý nhà trọ thảnh thơi',
    tieu_de_footer: 'HomeZen — Boarding House Management v1.0',
    gia_tri_thong_ke_1: '1k+',
    ten_thong_ke_1: 'Tin cậy',
    gia_tri_thong_ke_2: '99%',
    ten_thong_ke_2: 'Hài lòng',
    email_lien_he: '',
    sdt_lien_he: '',
    isActive: true
  };
}

/**
 * WebsiteConfigProvider
 * Provides website configuration to all components
 * Requirements: 4.1, 4.6
 */
export function WebsiteConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/website-config');

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch website configuration:', error);
      setError(error.message);
      // Fallback to default values
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (newConfig) => {
    try {
      setError(null);

      const response = await fetch('/api/admin/website-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update configuration');
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig);

      // Refresh configuration to ensure cache is updated
      await fetchConfiguration();

      return updatedConfig;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      setError(error.message);
      throw error;
    }
  };

  const refreshConfiguration = () => {
    return fetchConfiguration();
  };

  const getMergedConfig = () => {
    const defaults = getDefaultConfig();
    if (!config) return defaults;

    // Tạo bản copy của config và điền giá trị mặc định cho các trường trống
    const merged = { ...config };
    Object.keys(defaults).forEach(key => {
      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        merged[key] = defaults[key];
      }
    });
    return merged;
  };

  return (
    <WebsiteConfigContext.Provider value={{
      config: getMergedConfig(),
      loading,
      error,
      updateConfiguration,
      refreshConfiguration
    }}>
      {children}
    </WebsiteConfigContext.Provider>
  );
}

/**
 * Hook to use website configuration
 * Requirements: 4.1
 */
export const useWebsiteConfig = () => {
  const context = useContext(WebsiteConfigContext);
  if (!context) {
    // Return default config if context is not available
    // This allows components to work even without provider
    return {
      config: getDefaultConfig(),
      loading: false,
      error: null,
      updateConfiguration: async () => {
        throw new Error('WebsiteConfigProvider is not available');
      },
      refreshConfiguration: () => { }
    };
  }
  return context;
};
