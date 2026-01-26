// lib/services/website-configuration.service.js
import prisma from '@/lib/prisma';
import { CloudinaryService } from './cloudinary.service';
import { websiteConfigSchema, defaultWebsiteConfig } from '@/lib/validations/website-config.validation';

/**
 * Website Configuration Service
 * Handles CRUD operations for website configuration with caching
 * Requirements: 2.3, 4.5, 8.1, 8.2
 */
export class WebsiteConfigurationService {
  constructor() {
    this.cloudinary = new CloudinaryService();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current active configuration
   * Returns cached version if available and not expired
   * Requirements: 4.5, 8.1, 8.2
   */
  async getCurrentConfiguration() {
    const cacheKey = 'website-config';
    const cached = this.cache.get(cacheKey);

    // Check if cache is valid (Skip cache in development to reflect immediate changes)
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Get active configuration from database
      const config = await prisma.websiteConfiguration.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      });

      // If no config found, return default
      if (!config) {
        const defaultConfig = this.getDefaultConfiguration();
        this.cache.set(cacheKey, {
          data: defaultConfig,
          timestamp: Date.now()
        });
        return defaultConfig;
      }

      // Merge with default values to ensure image URLs always have fallback
      const defaultConfig = this.getDefaultConfiguration();
      const configData = {
        ...config,
        // Use default image URLs if config URLs are null, undefined, or empty
        logoUrl: config.logoUrl && config.logoUrl.trim() !== ''
          ? config.logoUrl
          : defaultConfig.logoUrl,
        faviconUrl: config.faviconUrl && config.faviconUrl.trim() !== ''
          ? config.faviconUrl
          : defaultConfig.faviconUrl,
        heroImageUrl: config.heroImageUrl && config.heroImageUrl.trim() !== ''
          ? config.heroImageUrl
          : defaultConfig.heroImageUrl,
        errorImageUrl: config.errorImageUrl && config.errorImageUrl.trim() !== ''
          ? config.errorImageUrl
          : defaultConfig.errorImageUrl,
      };

      // Update cache
      this.cache.set(cacheKey, {
        data: configData,
        timestamp: Date.now()
      });

      return configData;
    } catch (error) {
      console.error('Error fetching website configuration:', error);
      // Return default configuration on error
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Update website configuration
   * Deactivates current config and creates new one
   * Requirements: 2.2, 2.3, 5.7
   */
  async updateConfiguration(data, userId) {
    try {
      // Validate input data (schema handles empty strings via union type)
      const validatedData = websiteConfigSchema.parse(data);

      // Deactivate all current configurations
      await prisma.websiteConfiguration.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Create new active configuration
      const newConfig = await prisma.websiteConfiguration.create({
        data: {
          ...validatedData,
          isActive: true,
          createdBy: userId,
          updatedBy: userId
        }
      });

      // Invalidate cache
      this.invalidateCache();

      return newConfig;
    } catch (error) {
      console.error('Error updating website configuration:', error);

      // Handle validation errors
      if (error.name === 'ZodError' && error.errors && Array.isArray(error.errors)) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.details = errors;
        throw validationError;
      }

      throw error;
    }
  }

  /**
   * Delete old image from Cloudinary when replacing
   * Requirements: 6.5
   */
  async deleteOldImage(imageUrl) {
    if (!imageUrl || imageUrl.startsWith('/')) {
      // Local file, skip deletion
      return;
    }

    try {
      await this.cloudinary.deleteImage(imageUrl);
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Don't throw - allow deletion to fail gracefully
    }
  }

  /**
   * Get default configuration
   * Requirements: 2.5
   */
  getDefaultConfiguration() {
    return {
      id: 'default',
      ...defaultWebsiteConfig,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Invalidate cache
   * Requirements: 8.2
   */
  invalidateCache() {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific key
   */
  clearCache(key) {
    this.cache.delete(key);
  }
}

// Singleton instance
let serviceInstance = null;

export function getWebsiteConfigurationService() {
  if (!serviceInstance) {
    serviceInstance = new WebsiteConfigurationService();
  }
  return serviceInstance;
}
