// components/ui/CloudinaryUploadWidget.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "./loading";

/**
 * CloudinaryUploadWidget
 * Component for uploading images to Cloudinary
 * Requirements: 3.3, 6.4
 */
export function CloudinaryUploadWidget({
  onUpload,
  currentImage,
  folder = "website-config",
  label = "Tải lên hình ảnh",
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
    "image/vnd.microsoft.icon",
  ],
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Sync preview with currentImage prop changes
  useEffect(() => {
    if (currentImage) {
      setPreview(currentImage);
    } else if (currentImage === "") {
      // Only clear preview if explicitly set to empty string
      // This allows the component to show the upload area when image is removed
      setPreview(null);
    }
  }, [currentImage]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      const errorMsg =
        "Loại file không được hỗ trợ. Chỉ chấp nhận: JPEG, PNG, WebP, SVG";
      setError(errorMsg);
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const errorMsg = `Kích thước file vượt quá giới hạn. Tối đa: ${maxSize / 1024 / 1024}MB`;
      setError(errorMsg);
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    await handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/website-config/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      // Update preview with secure URL
      setPreview(result.secureUrl);

      // Call callback with result
      if (onUpload) {
        onUpload(result);
      }

      toast({
        title: "Thành công",
        description: "Hình ảnh đã được tải lên thành công",
        variant: "success",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setError(error.message);
      setPreview(null);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lên hình ảnh",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (onUpload) {
      onUpload({ secureUrl: null });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">{label}</label>

      {preview ? (
        <div className="relative inline-block">
          <div className="relative w-48 h-48 border rounded-lg overflow-hidden flex items-center justify-center bg-muted/20">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            {uploading ? "Đang tải lên..." : "Nhấp để chọn hình ảnh"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, SVG (tối đa {maxSize / 1024 / 1024}MB)
          </p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loading text="Đang tải lên..." />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!preview && !uploading && (
        <Button type="button" variant="outline" onClick={handleClick}>
          <Upload className="h-4 w-4 mr-2" />
          Chọn hình ảnh
        </Button>
      )}
    </div>
  );
}
