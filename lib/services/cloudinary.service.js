// lib/services/cloudinary.service.js
import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Service
 * Handles image upload, deletion, and URL generation
 * Requirements: 1.1, 1.2, 1.4
 */
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Upload image to Cloudinary
   * @param {string|Buffer} file - File path, base64 string, or buffer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with secure_url
   */
  async uploadImage(file, options = {}) {
    try {
      const defaultOptions = {
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      };
      
      // If public_id is provided, don't use folder (to avoid duplicate folder path)
      // If public_id is not provided, use default folder
      const uploadOptions = {
        ...defaultOptions,
        ...options
      };
      
      // Only add folder if public_id doesn't contain folder path
      if (!uploadOptions.public_id || !uploadOptions.public_id.includes('/')) {
        uploadOptions.folder = uploadOptions.folder || 'website-config';
      }
      
      const result = await cloudinary.uploader.upload(file, uploadOptions);

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        return { result: 'not_found' };
      }

      // Extract public_id from URL if full URL is provided
      const extractedPublicId = this.extractPublicId(publicId);
      
      const result = await cloudinary.uploader.destroy(extractedPublicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Don't throw - allow deletion to fail gracefully
      return { result: 'error', error: error.message };
    }
  }

  /**
   * Generate optimized URL for image
   * @param {string} publicId - Cloudinary public ID or URL
   * @param {Object} transformations - Image transformations
   * @returns {string} Optimized image URL
   */
  generateUrl(publicId, transformations = {}) {
    try {
      const extractedPublicId = this.extractPublicId(publicId);
      
      const defaultTransformations = {
        quality: 'auto',
        fetch_format: 'auto',
        ...transformations
      };

      return cloudinary.url(extractedPublicId, defaultTransformations);
    } catch (error) {
      console.error('Cloudinary URL generation error:', error);
      // Fallback to original URL
      return publicId;
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param {string} urlOrPublicId - Full URL or public ID
   * @returns {string} Public ID
   */
  extractPublicId(urlOrPublicId) {
    if (!urlOrPublicId) {
      return '';
    }

    // If it's already a public_id (no http/https), return as is
    if (!urlOrPublicId.startsWith('http')) {
      return urlOrPublicId;
    }

    // Extract public_id from URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = urlOrPublicId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      return match[1];
    }

    // Fallback: try to extract from folder structure
    const parts = urlOrPublicId.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && parts[uploadIndex + 2]) {
      return parts.slice(uploadIndex + 2).join('/').replace(/\.[^.]+$/, '');
    }

    return urlOrPublicId;
  }

  /**
   * Generate responsive image URLs for different sizes
   * @param {string} publicId - Cloudinary public ID or URL
   * @param {Object} sizes - Size configurations
   * @returns {Object} URLs for different sizes
   */
  generateResponsiveUrls(publicId, sizes = {}) {
    const defaultSizes = {
      thumbnail: { width: 150, height: 150, crop: 'fill' },
      small: { width: 300, height: 300, crop: 'limit' },
      medium: { width: 600, height: 600, crop: 'limit' },
      large: { width: 1200, height: 1200, crop: 'limit' },
      ...sizes
    };

    const urls = {};
    for (const [size, transformations] of Object.entries(defaultSizes)) {
      urls[size] = this.generateUrl(publicId, transformations);
    }

    return urls;
  }
}
