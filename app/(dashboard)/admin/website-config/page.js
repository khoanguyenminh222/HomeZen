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
        logoUrl: config.logoUrl || '',
        faviconUrl: config.faviconUrl || '',
        heroImageUrl: config.heroImageUrl || '',
        errorImageUrl: config.errorImageUrl || '',
        websiteTitle: config.websiteTitle || '',
        websiteDescription: config.websiteDescription || '',
        brandName: config.brandName || '',
        heroTitle: config.heroTitle || '',
        heroSubtitle: config.heroSubtitle || '',
        footerText: config.footerText || '',
        stat1Value: config.stat1Value || '',
        stat1Label: config.stat1Label || '',
        stat2Value: config.stat2Value || '',
        stat2Label: config.stat2Label || '',
        contactEmail: config.contactEmail || '',
        contactPhone: config.contactPhone || ''
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

    if (!formData.websiteTitle || formData.websiteTitle.trim().length === 0) {
      newErrors.websiteTitle = 'Tiêu đề website không được để trống';
    } else if (formData.websiteTitle.length > 100) {
      newErrors.websiteTitle = 'Tiêu đề website không được vượt quá 100 ký tự';
    }

    if (!formData.websiteDescription || formData.websiteDescription.trim().length === 0) {
      newErrors.websiteDescription = 'Mô tả website không được để trống';
    } else if (formData.websiteDescription.length > 500) {
      newErrors.websiteDescription = 'Mô tả website không được vượt quá 500 ký tự';
    }

    if (!formData.brandName || formData.brandName.trim().length === 0) {
      newErrors.brandName = 'Tên thương hiệu không được để trống';
    } else if (formData.brandName.length > 50) {
      newErrors.brandName = 'Tên thương hiệu không được vượt quá 50 ký tự';
    }

    if (!formData.heroTitle || formData.heroTitle.trim().length === 0) {
      newErrors.heroTitle = 'Tiêu đề hero không được để trống';
    } else if (formData.heroTitle.length > 200) {
      newErrors.heroTitle = 'Tiêu đề hero không được vượt quá 200 ký tự';
    }

    if (!formData.heroSubtitle || formData.heroSubtitle.trim().length === 0) {
      newErrors.heroSubtitle = 'Phụ đề hero không được để trống';
    } else if (formData.heroSubtitle.length > 200) {
      newErrors.heroSubtitle = 'Phụ đề hero không được vượt quá 200 ký tự';
    }

    if (!formData.footerText || formData.footerText.trim().length === 0) {
      newErrors.footerText = 'Văn bản footer không được để trống';
    } else     if (formData.footerText.length > 200) {
      newErrors.footerText = 'Văn bản footer không được vượt quá 200 ký tự';
    }

    if (!formData.stat1Value || formData.stat1Value.trim().length === 0) {
      newErrors.stat1Value = 'Giá trị thống kê 1 không được để trống';
    } else if (formData.stat1Value.length > 50) {
      newErrors.stat1Value = 'Giá trị thống kê 1 không được vượt quá 50 ký tự';
    }

    if (!formData.stat1Label || formData.stat1Label.trim().length === 0) {
      newErrors.stat1Label = 'Nhãn thống kê 1 không được để trống';
    } else if (formData.stat1Label.length > 50) {
      newErrors.stat1Label = 'Nhãn thống kê 1 không được vượt quá 50 ký tự';
    }

    if (!formData.stat2Value || formData.stat2Value.trim().length === 0) {
      newErrors.stat2Value = 'Giá trị thống kê 2 không được để trống';
    } else if (formData.stat2Value.length > 50) {
      newErrors.stat2Value = 'Giá trị thống kê 2 không được vượt quá 50 ký tự';
    }

    if (!formData.stat2Label || formData.stat2Label.trim().length === 0) {
      newErrors.stat2Label = 'Nhãn thống kê 2 không được để trống';
    } else if (formData.stat2Label.length > 50) {
      newErrors.stat2Label = 'Nhãn thống kê 2 không được vượt quá 50 ký tự';
    }

    // Validate URLs if provided
    if (formData.logoUrl && formData.logoUrl.trim() && !formData.logoUrl.startsWith('/') && !formData.logoUrl.startsWith('http')) {
      newErrors.logoUrl = 'Logo URL không hợp lệ';
    }

    if (formData.faviconUrl && formData.faviconUrl.trim() && !formData.faviconUrl.startsWith('/') && !formData.faviconUrl.startsWith('http')) {
      newErrors.faviconUrl = 'Favicon URL không hợp lệ';
    }

    if (formData.heroImageUrl && formData.heroImageUrl.trim() && !formData.heroImageUrl.startsWith('/') && !formData.heroImageUrl.startsWith('http')) {
      newErrors.heroImageUrl = 'Hero image URL không hợp lệ';
    }

    if (formData.errorImageUrl && formData.errorImageUrl.trim() && !formData.errorImageUrl.startsWith('/') && !formData.errorImageUrl.startsWith('http')) {
      newErrors.errorImageUrl = 'Error image URL không hợp lệ';
    }

    // Validate contact email if provided
    if (formData.contactEmail && formData.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Email liên hệ phải là email hợp lệ';
      }
    }

    // Validate contact phone if provided
    if (formData.contactPhone && formData.contactPhone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]*$/;
      if (!phoneRegex.test(formData.contactPhone)) {
        newErrors.contactPhone = 'Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc';
      } else if (formData.contactPhone.length > 20) {
        newErrors.contactPhone = 'Số điện thoại không được vượt quá 20 ký tự';
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
  const isFormDataInitialized = formData.hasOwnProperty('websiteTitle');
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
          {/* <Label htmlFor="logoUrl">Logo Chính</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('logoUrl', result)}
            currentImage={formData.logoUrl}
            folder="website-config/logo"
            label="Logo chính"
          />
          {errors.logoUrl && (
            <p className="text-sm text-destructive">{errors.logoUrl}</p>
          )}
        </div>

        {/* Favicon Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="faviconUrl">Favicon</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('faviconUrl', result)}
            currentImage={formData.faviconUrl}
            folder="website-config/favicon"
            label="Favicon"
          />
          {errors.faviconUrl && (
            <p className="text-sm text-destructive">{errors.faviconUrl}</p>
          )}
        </div>

        {/* Hero Image Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="heroImageUrl">Hình Ảnh Hero</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('heroImageUrl', result)}
            currentImage={formData.heroImageUrl}
            folder="website-config/hero"
            label="Hình ảnh hero"
          />
          {errors.heroImageUrl && (
            <p className="text-sm text-destructive">{errors.heroImageUrl}</p>
          )}
        </div>

        {/* Error Image Upload */}
        <div className="space-y-2">
          {/* <Label htmlFor="errorImageUrl">Hình Ảnh Error Page</Label> */}
          <CloudinaryUploadWidget
            onUpload={(result) => handleImageUpload('errorImageUrl', result)}
            currentImage={formData.errorImageUrl}
            folder="website-config/error"
            label="Hình ảnh error page"
          />
          {errors.errorImageUrl && (
            <p className="text-sm text-destructive">{errors.errorImageUrl}</p>
          )}
        </div>

        {/* Website Title */}
        <div className="space-y-2">
          <Label htmlFor="websiteTitle">Tiêu Đề Website *</Label>
          <Input
            id="websiteTitle"
            value={formData.websiteTitle || ''}
            onChange={(e) => handleInputChange('websiteTitle', e.target.value)}
            maxLength={100}
            placeholder="HomeZen - Ứng dụng quản lý nhà trọ"
          />
          <p className="text-xs text-muted-foreground">
            {formData.websiteTitle?.length || 0}/100 ký tự
          </p>
          {errors.websiteTitle && (
            <p className="text-sm text-destructive">{errors.websiteTitle}</p>
          )}
        </div>

        {/* Website Description */}
        <div className="space-y-2">
          <Label htmlFor="websiteDescription">Mô Tả Website *</Label>
          <Textarea
            id="websiteDescription"
            value={formData.websiteDescription || ''}
            onChange={(e) => handleInputChange('websiteDescription', e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Quản lý phòng trọ, người thuê, hóa đơn điện nước dễ dàng và hiện đại"
          />
          <p className="text-xs text-muted-foreground">
            {formData.websiteDescription?.length || 0}/500 ký tự
          </p>
          {errors.websiteDescription && (
            <p className="text-sm text-destructive">{errors.websiteDescription}</p>
          )}
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <Label htmlFor="brandName">Tên Thương Hiệu *</Label>
          <Input
            id="brandName"
            value={formData.brandName || ''}
            onChange={(e) => handleInputChange('brandName', e.target.value)}
            maxLength={50}
            placeholder="HomeZen"
          />
          <p className="text-xs text-muted-foreground">
            {formData.brandName?.length || 0}/50 ký tự
          </p>
          {errors.brandName && (
            <p className="text-sm text-destructive">{errors.brandName}</p>
          )}
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <Label htmlFor="heroTitle">Tiêu Đề Hero *</Label>
          <Input
            id="heroTitle"
            value={formData.heroTitle || ''}
            onChange={(e) => handleInputChange('heroTitle', e.target.value)}
            maxLength={200}
            placeholder="Chào Mừng Đến Với HomeZen"
          />
          <p className="text-xs text-muted-foreground">
            {formData.heroTitle?.length || 0}/200 ký tự
          </p>
          {errors.heroTitle && (
            <p className="text-sm text-destructive">{errors.heroTitle}</p>
          )}
        </div>

        {/* Hero Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="heroSubtitle">Phụ Đề Hero *</Label>
          <Input
            id="heroSubtitle"
            value={formData.heroSubtitle || ''}
            onChange={(e) => handleInputChange('heroSubtitle', e.target.value)}
            maxLength={200}
            placeholder="Quản lý nhà trọ thảnh thơi"
          />
          <p className="text-xs text-muted-foreground">
            {formData.heroSubtitle?.length || 0}/200 ký tự
          </p>
          {errors.heroSubtitle && (
            <p className="text-sm text-destructive">{errors.heroSubtitle}</p>
          )}
        </div>

        {/* Footer Text */}
        <div className="space-y-2">
          <Label htmlFor="footerText">Văn Bản Footer *</Label>
          <Input
            id="footerText"
            value={formData.footerText || ''}
            onChange={(e) => handleInputChange('footerText', e.target.value)}
            maxLength={200}
            placeholder="HomeZen — Boarding House Management v1.0"
          />
          <p className="text-xs text-muted-foreground">
            {formData.footerText?.length || 0}/200 ký tự
          </p>
          {errors.footerText && (
            <p className="text-sm text-destructive">{errors.footerText}</p>
          )}
        </div>

        {/* Statistics Section */}
        <div className="space-y-6 pt-4 border-t">
          <h3 className="text-lg font-semibold">Thống Kê</h3>
          
          {/* Stat 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stat1Value">Giá Trị Thống Kê 1 *</Label>
              <Input
                id="stat1Value"
                value={formData.stat1Value || ''}
                onChange={(e) => handleInputChange('stat1Value', e.target.value)}
                maxLength={50}
                placeholder="1k+"
              />
              <p className="text-xs text-muted-foreground">
                {formData.stat1Value?.length || 0}/50 ký tự
              </p>
              {errors.stat1Value && (
                <p className="text-sm text-destructive">{errors.stat1Value}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat1Label">Nhãn Thống Kê 1 *</Label>
              <Input
                id="stat1Label"
                value={formData.stat1Label || ''}
                onChange={(e) => handleInputChange('stat1Label', e.target.value)}
                maxLength={50}
                placeholder="Tin cậy"
              />
              <p className="text-xs text-muted-foreground">
                {formData.stat1Label?.length || 0}/50 ký tự
              </p>
              {errors.stat1Label && (
                <p className="text-sm text-destructive">{errors.stat1Label}</p>
              )}
            </div>
          </div>

          {/* Stat 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stat2Value">Giá Trị Thống Kê 2 *</Label>
              <Input
                id="stat2Value"
                value={formData.stat2Value || ''}
                onChange={(e) => handleInputChange('stat2Value', e.target.value)}
                maxLength={50}
                placeholder="99%"
              />
              <p className="text-xs text-muted-foreground">
                {formData.stat2Value?.length || 0}/50 ký tự
              </p>
              {errors.stat2Value && (
                <p className="text-sm text-destructive">{errors.stat2Value}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stat2Label">Nhãn Thống Kê 2 *</Label>
              <Input
                id="stat2Label"
                value={formData.stat2Label || ''}
                onChange={(e) => handleInputChange('stat2Label', e.target.value)}
                maxLength={50}
                placeholder="Hài lòng"
              />
              <p className="text-xs text-muted-foreground">
                {formData.stat2Label?.length || 0}/50 ký tự
              </p>
              {errors.stat2Label && (
                <p className="text-sm text-destructive">{errors.stat2Label}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-6 pt-4 border-t">
          <h3 className="text-lg font-semibold">Thông Tin Liên Hệ</h3>
          
          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email Liên Hệ</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="support@homezen.com"
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Số Điện Thoại Liên Hệ</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone || ''}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              maxLength={20}
              placeholder="0123456789"
            />
            <p className="text-xs text-muted-foreground">
              {formData.contactPhone?.length || 0}/20 ký tự
            </p>
            {errors.contactPhone && (
              <p className="text-sm text-destructive">{errors.contactPhone}</p>
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
