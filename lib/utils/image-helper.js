// lib/utils/image-helper.js

/**
 * Check if URL is from Cloudinary
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export function isCloudinaryUrl(url) {
  if (!url) return false;
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Extract public_id from Cloudinary URL for CldImage
 * @param {string} url - Full Cloudinary URL
 * @returns {string} Public ID
 */
export function extractCloudinaryPublicId(url) {
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  try {
    let cleanUrl = url.split('?')[0];
    
    try {
      cleanUrl = decodeURIComponent(cleanUrl);
    } catch (e) {
      // If decoding fails, use original
    }
    
    const uploadIndex = cleanUrl.indexOf('/upload/');
    if (uploadIndex === -1) {
      return url;
    }
    
    let pathAfterUpload = cleanUrl.substring(uploadIndex + 8);
    pathAfterUpload = pathAfterUpload.replace(/\.[^.]+$/, '');
    const parts = pathAfterUpload.split('/');
    
    let versionIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (/^v\d+$/.test(parts[i])) {
        versionIndex = i;
        break;
      }
    }
    
    let publicId;
    if (versionIndex !== -1 && versionIndex < parts.length - 1) {
      publicId = parts.slice(versionIndex + 1).join('/');
    } else {
      let startIndex = 0;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isTransformation = part.includes('_') && 
                                 (part.includes(',') || /^[a-z]_[a-z]+$/i.test(part)) &&
                                 !part.includes(' ') &&
                                 !/^\d+-/.test(part);
        
        if (!isTransformation) {
          startIndex = i;
          break;
        }
      }
      publicId = parts.slice(startIndex).join('/');
    }
    
    try {
      publicId = decodeURIComponent(publicId);
    } catch (e) {
      // If decoding fails, use as is
    }
    
    return publicId;
  } catch (error) {
    console.error('Error extracting Cloudinary public_id:', error, 'URL:', url);
    return url;
  }
}
