// app/(dashboard)/admin/website-config/page.js
'use client';
import { useState, useEffect } from 'react';
import { useWebsiteConfig } from '@/contexts/WebsiteConfigContext';
import { CloudinaryUploadWidget } from '@/components/ui/CloudinaryUploadWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

/**
 * Website Configuration Admin Page
 * Requirements: 3.1, 3.2, 3.4
 */
export default function WebsiteConfigPage() {
  const { config, loading: configLoading, updateConfiguration } = useWebsiteConfig();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    // Only set formData when config is loaded and not loading
    if (config && !configLoading) {
      setFormData({
        logo_url: config.logo_url || '',
        favicon_url: config.favicon_url || '',
        anh_hero_url: config.anh_hero_url || '',
        anh_loi_url: config.anh_loi_url || '',
        tieu_de_website: config.tieu_de_website || '',
        mo_ta_website: config.mo_ta_website || '',
        ten_thuong_hieu: config.ten_thuong_hieu || '',
        tieu_de_hero: config.tieu_de_hero || '',
        phu_de_hero: config.phu_de_hero || '',
        tieu_de_footer: config.tieu_de_footer || '',
        gia_tri_thong_ke_1: config.gia_tri_thong_ke_1 || '',
        ten_thong_ke_1: config.ten_thong_ke_1 || '',
        gia_tri_thong_ke_2: config.gia_tri_thong_ke_2 || '',
        ten_thong_ke_2: config.ten_thong_ke_2 || '',
        email_lien_he: config.email_lien_he || '',
        sdt_lien_he: config.sdt_lien_he || ''
      });
    }
  }, [config, configLoading]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageUpload = (field, result) => {
    if (result && result.secureUrl) {
      handleInputChange(field, result.secureUrl);
    } else {
      handleInputChange(field, '');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tieu_de_website || formData.tieu_de_website.trim().length === 0) {
      newErrors.tieu_de_website = 'Tiêu đề website không được để trống';
    } else if (formData.tieu_de_website.length > 100) {
      newErrors.tieu_de_website = 'Tiêu đề website không được vượt quá 100 ký tự';
    }

    if (!formData.mo_ta_website || formData.mo_ta_website.trim().length === 0) {
      newErrors.mo_ta_website = 'Mô tả website không được để trống';
    } else if (formData.mo_ta_website.length > 500) {
      newErrors.mo_ta_website = 'Mô tả website không được vượt quá 500 ký tự';
    }

    if (!formData.ten_thuong_hieu || formData.ten_thuong_hieu.trim().length === 0) {
      newErrors.ten_thuong_hieu = 'Tên thương hiệu không được để trống';
    } else if (formData.ten_thuong_hieu.length > 50) {
      newErrors.ten_thuong_hieu = 'Tên thương hiệu không được vượt quá 50 ký tự';
    }

    if (!formData.tieu_de_hero || formData.tieu_de_hero.trim().length === 0) {
      newErrors.tieu_de_hero = 'Tiêu đề hero không được để trống';
    } else if (formData.tieu_de_hero.length > 200) {
      newErrors.tieu_de_hero = 'Tiêu đề hero không được vượt quá 200 ký tự';
    }

    if (!formData.phu_de_hero || formData.phu_de_hero.trim().length === 0) {
      newErrors.phu_de_hero = 'Phụ đề hero không được để trống';
    } else if (formData.phu_de_hero.length > 200) {
      newErrors.phu_de_hero = 'Phụ đề hero không được vượt quá 200 ký tự';
    }

    if (!formData.tieu_de_footer || formData.tieu_de_footer.trim().length === 0) {
      newErrors.tieu_de_footer = 'Văn bản footer không được để trống';
    } else if (formData.tieu_de_footer.length > 200) {
      newErrors.tieu_de_footer = 'Văn bản footer không được vượt quá 200 ký tự';
    }

    if (!formData.gia_tri_thong_ke_1 || formData.gia_tri_thong_ke_1.trim().length === 0) {
      newErrors.gia_tri_thong_ke_1 = 'Giá trị thống kê 1 không được để trống';
    } else if (formData.gia_tri_thong_ke_1.length > 50) {
      newErrors.gia_tri_thong_ke_1 = 'Giá trị thống kê 1 không được vượt quá 50 ký tự';
    }

    if (!formData.ten_thong_ke_1 || formData.ten_thong_ke_1.trim().length === 0) {
      newErrors.ten_thong_ke_1 = 'Nhãn thống kê 1 không được để trống';
    } else if (formData.ten_thong_ke_1.length > 50) {
      newErrors.ten_thong_ke_1 = 'Nhãn thống kê 1 không được vượt quá 50 ký tự';
    }

    if (!formData.gia_tri_thong_ke_2 || formData.gia_tri_thong_ke_2.trim().length === 0) {
      newErrors.gia_tri_thong_ke_2 = 'Giá trị thống kê 2 không được để trống';
    } else if (formData.gia_tri_thong_ke_2.length > 50) {
      newErrors.gia_tri_thong_ke_2 = 'Giá trị thống kê 2 không được vượt quá 50 ký tự';
    }

    if (!formData.ten_thong_ke_2 || formData.ten_thong_ke_2.trim().length === 0) {
      newErrors.ten_thong_ke_2 = 'Nhãn thống kê 2 không được để trống';
    } else if (formData.ten_thong_ke_2.length > 50) {
      newErrors.ten_thong_ke_2 = 'Nhãn thống kê 2 không được vượt quá 50 ký tự';
    }

    // Validate URLs if provided
    if (formData.logo_url && formData.logo_url.trim() && !formData.logo_url.startsWith('/') && !formData.logo_url.startsWith('http')) {
      newErrors.logo_url = 'Logo URL không hợp lệ';
    }

    if (formData.favicon_url && formData.favicon_url.trim() && !formData.favicon_url.startsWith('/') && !formData.favicon_url.startsWith('http')) {
      newErrors.favicon_url = 'Favicon URL không hợp lệ';
    }

    if (formData.anh_hero_url && formData.anh_hero_url.trim() && !formData.anh_hero_url.startsWith('/') && !formData.anh_hero_url.startsWith('http')) {
      newErrors.anh_hero_url = 'Hero image URL không hợp lệ';
    }

    if (formData.anh_loi_url && formData.anh_loi_url.trim() && !formData.anh_loi_url.startsWith('/') && !formData.anh_loi_url.startsWith('http')) {
      newErrors.anh_loi_url = 'Error image URL không hợp lệ';
    }

    // Validate contact email if provided
    if (formData.email_lien_he && formData.email_lien_he.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email_lien_he)) {
        newErrors.email_lien_he = 'Email liên hệ phải là email hợp lệ';
      }
    }

    // Validate contact phone if provided
    if (formData.sdt_lien_he && formData.sdt_lien_he.trim()) {
      const phoneRegex = /^[0-9+\-\s()]*$/;
      if (!phoneRegex.test(formData.sdt_lien_he)) {
        newErrors.sdt_lien_he = 'Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc';
      } else if (formData.sdt_lien_he.length > 20) {
        newErrors.sdt_lien_he = 'Số điện thoại không được vượt quá 20 ký tự';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng kiểm tra lại các trường đã nhập',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      await updateConfiguration(formData);
      toast({
        title: 'Thành công',
        description: 'Cấu hình website đã được cập nhật thành công',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật cấu hình',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Wait for config to load before rendering form
  if (configLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render form until formData is initialized with config data
  const isFormDataInitialized = formData.hasOwnProperty('tieu_de_website');
  if (!isFormDataInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cấu Hình Website</h1>
        <p className="text-muted-foreground">
          Quản lý thương hiệu và nội dung website HomeZen
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="logo_url">Logo Chính</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('logo_url', result)}
            currentImage={formData.logo_url}
            folder="website-config/logo"
            label="Logo chính"
          />
          {errors.logo_url && (
            <p className="text-sm text-destructive">{errors.logo_url}</p>
          )}
        </div>

        {/* Favicon Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="favicon_url">Favicon</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('favicon_url', result)}
            currentImage={formData.favicon_url}
            folder="website-config/favicon"
            label="Favicon"
          />
          {errors.favicon_url && (
            <p className="text-sm text-destructive">{errors.favicon_url}</p>
          )}
        </div>

        {/* Hero Image Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="anh_hero_url">Hình Ảnh Hero</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('anh_hero_url', result)}
            currentImage={formData.anh_hero_url}
            folder="website-config/hero"
            label="Hình ảnh hero"
          />
          {errors.anh_hero_url && (
            <p className="text-sm text-destructive">{errors.anh_hero_url}</p>
          )}
        </div>

        {/* Error Image Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="anh_loi_url">Hình Ảnh Error Page</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('anh_loi_url', result)}
            currentImage={formData.anh_loi_url}
            folder="website-config/error"
            label="Hình ảnh error page"
          />
          {errors.anh_loi_url && (
            <p className="text-sm text-destructive">{errors.anh_loi_url}</p>
          )}
        </div>

        {/* Website Title */}
        <div className="space-y-2">
          <Label htmlFor="tieu_de_website">Tiêu Đề Website *</Label>
          <Input
            id="tieu_de_website"
            value={formData.tieu_de_website || ''}
            onChange={(e) => handleInputChange('tieu_de_website', e.target.value)}
            maxLength={100}
            placeholder="HomeZen - Ứng dụng quản lý nhà trọ"
          />
          <p className="text-xs text-muted-foreground">
            {formData.tieu_de_website?.length || 0}/100 ký tự
          </p>
          {errors.tieu_de_website && (
            <p className="text-sm text-destructive">{errors.tieu_de_website}</p>
          )}
        </div>

        {/* Website Description */}
        <div className="space-y-2">
          <Label htmlFor="mo_ta_website">Mô Tả Website *</Label>
          <Textarea
            id="mo_ta_website"
            value={formData.mo_ta_website || ''}
            onChange={(e) => handleInputChange('mo_ta_website', e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại"
          />
          <p className="text-xs text-muted-foreground">
            {formData.mo_ta_website?.length || 0}/500 ký tự
          </p>
          {errors.mo_ta_website && (
            <p className="text-sm text-destructive">{errors.mo_ta_website}</p>
          )}
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <Label htmlFor="ten_thuong_hieu">Tên Thương Hiệu *</Label>
          <Input
            id="ten_thuong_hieu"
            value={formData.ten_thuong_hieu || ''}
            onChange={(e) => handleInputChange('ten_thuong_hieu', e.target.value)}
            maxLength={50}
            placeholder="HomeZen"
          />
          <p className="text-xs text-muted-foreground">
            {formData.ten_thuong_hieu?.length || 0}/50 ký tự
          </p>
          {errors.ten_thuong_hieu && (
            <p className="text-sm text-destructive">{errors.ten_thuong_hieu}</p>
          )}
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <Label htmlFor="tieu_de_hero">Tiêu Đề Hero *</Label>
          <Input
            id="tieu_de_hero"
            value={formData.tieu_de_hero || ''}
            onChange={(e) => handleInputChange('tieu_de_hero', e.target.value)}
            maxLength={200}
            placeholder="Chào Mừng Đến Với HomeZen"
          />
          <p className="text-xs text-muted-foreground">
            {formData.tieu_de_hero?.length || 0}/200 ký tự
          </p>
          {errors.tieu_de_hero && (
            <p className="text-sm text-destructive">{errors.tieu_de_hero}</p>
          )}
        </div>

        {/* Hero Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="phu_de_hero">Phụ Đề Hero *</Label>
          <Input
            id="phu_de_hero"
            value={formData.phu_de_hero || ''}
            onChange={(e) => handleInputChange('phu_de_hero', e.target.value)}
            maxLength={200}
            placeholder="Quản lý nhà trọ thảnh thơi"
          />
          <p className="text-xs text-muted-foreground">
            {formData.phu_de_hero?.length || 0}/200 ký tự
          </p>
          {errors.phu_de_hero && (
            <p className="text-sm text-destructive">{errors.phu_de_hero}</p>
          )}
        </div>

        {/* Footer Text */}
        <div className="space-y-2">
          <Label htmlFor="tieu_de_footer">Văn Bản Footer *</Label>
          <Input
            id="tieu_de_footer"
            value={formData.tieu_de_footer || ''}
            onChange={(e) => handleInputChange('tieu_de_footer', e.target.value)}
            maxLength={200}
            placeholder="HomeZen — Boarding House Management v1.0"
          />
          <p className="text-xs text-muted-foreground">
            {formData.tieu_de_footer?.length || 0}/200 ký tự
          </p>
          {errors.tieu_de_footer && (
            <p className="text-sm text-destructive">{errors.tieu_de_footer}</p>
          )}
        </div>

        {/* Statistics Section */}
        <div className="space-y-6 pt-4 border-t">
          <h3 className="text-lg font-semibold">Thống Kê</h3>

          {/* Stat 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gia_tri_thong_ke_1">Giá Trị Thống Kê 1 *</Label>
              <Input
                id="gia_tri_thong_ke_1"
                value={formData.gia_tri_thong_ke_1 || ''}
                onChange={(e) => handleInputChange('gia_tri_thong_ke_1', e.target.value)}
                maxLength={50}
                placeholder="1k+"
              />
              <p className="text-xs text-muted-foreground">
                {formData.gia_tri_thong_ke_1?.length || 0}/50 ký tự
              </p>
              {errors.gia_tri_thong_ke_1 && (
                <p className="text-sm text-destructive">{errors.gia_tri_thong_ke_1}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ten_thong_ke_1">Nhãn Thống Kê 1 *</Label>
              <Input
                id="ten_thong_ke_1"
                value={formData.ten_thong_ke_1 || ''}
                onChange={(e) => handleInputChange('ten_thong_ke_1', e.target.value)}
                maxLength={50}
                placeholder="Tin cậy"
              />
              <p className="text-xs text-muted-foreground">
                {formData.ten_thong_ke_1?.length || 0}/50 ký tự
              </p>
              {errors.ten_thong_ke_1 && (
                <p className="text-sm text-destructive">{errors.ten_thong_ke_1}</p>
              )}
            </div>
          </div>

          {/* Stat 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gia_tri_thong_ke_2">Giá Trị Thống Kê 2 *</Label>
              <Input
                id="gia_tri_thong_ke_2"
                value={formData.gia_tri_thong_ke_2 || ''}
                onChange={(e) => handleInputChange('gia_tri_thong_ke_2', e.target.value)}
                maxLength={50}
                placeholder="99%"
              />
              <p className="text-xs text-muted-foreground">
                {formData.gia_tri_thong_ke_2?.length || 0}/50 ký tự
              </p>
              {errors.gia_tri_thong_ke_2 && (
                <p className="text-sm text-destructive">{errors.gia_tri_thong_ke_2}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ten_thong_ke_2">Nhãn Thống Kê 2 *</Label>
              <Input
                id="ten_thong_ke_2"
                value={formData.ten_thong_ke_2 || ''}
                onChange={(e) => handleInputChange('ten_thong_ke_2', e.target.value)}
                maxLength={50}
                placeholder="Hài lòng"
              />
              <p className="text-xs text-muted-foreground">
                {formData.ten_thong_ke_2?.length || 0}/50 ký tự
              </p>
              {errors.ten_thong_ke_2 && (
                <p className="text-sm text-destructive">{errors.ten_thong_ke_2}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-6 pt-4 border-t">
          <h3 className="text-lg font-semibold">Thông Tin Liên Hệ</h3>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="email_lien_he">Email Liên Hệ</Label>
            <Input
              id="email_lien_he"
              type="email"
              value={formData.email_lien_he || ''}
              onChange={(e) => handleInputChange('email_lien_he', e.target.value)}
              placeholder="support@homezen.com"
            />
            {errors.email_lien_he && (
              <p className="text-sm text-destructive">{errors.email_lien_he}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="sdt_lien_he">Số Điện Thoại Liên Hệ</Label>
            <Input
              id="sdt_lien_he"
              type="tel"
              value={formData.sdt_lien_he || ''}
              onChange={(e) => handleInputChange('sdt_lien_he', e.target.value)}
              maxLength={20}
              placeholder="0123456789"
            />
            <p className="text-xs text-muted-foreground">
              {formData.sdt_lien_he?.length || 0}/20 ký tự
            </p>
            {errors.sdt_lien_he && (
              <p className="text-sm text-destructive">{errors.sdt_lien_he}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu cấu hình
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
