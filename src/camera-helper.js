/**
 * Camera Helper
 * Handles photo capture and compression for audit photos
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

class CameraHelper {
  constructor() {
    this.defaultQuality = 80; // 80% quality for compression
    this.maxWidth = 1920;
    this.maxHeight = 1920;
  }

  /**
   * Request camera permissions
   */
  async requestPermissions() {
    try {
      const permissions = await Camera.requestPermissions();
      console.log('[CameraHelper] Camera permissions:', permissions);
      return permissions.camera === 'granted' || permissions.photos === 'granted';
    } catch (error) {
      console.error('[CameraHelper] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check camera permissions
   */
  async checkPermissions() {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' || permissions.photos === 'granted';
    } catch (error) {
      console.error('[CameraHelper] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Take a photo using the camera
   */
  async takePhoto(options = {}) {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality || this.defaultQuality,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: options.width || this.maxWidth,
        height: options.height || this.maxHeight,
        correctOrientation: true,
        saveToGallery: options.saveToGallery || false
      });

      console.log('[CameraHelper] Photo captured successfully');

      return {
        dataUrl: photo.dataUrl,
        format: photo.format,
        saved: photo.saved || false,
        timestamp: Date.now(),
        size: this.estimateSize(photo.dataUrl)
      };
    } catch (error) {
      console.error('[CameraHelper] Error taking photo:', error);
      throw error;
    }
  }

  /**
   * Select a photo from the gallery
   */
  async selectFromGallery(options = {}) {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Photos permission denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality || this.defaultQuality,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: options.width || this.maxWidth,
        height: options.height || this.maxHeight,
        correctOrientation: true
      });

      console.log('[CameraHelper] Photo selected from gallery');

      return {
        dataUrl: photo.dataUrl,
        format: photo.format,
        timestamp: Date.now(),
        size: this.estimateSize(photo.dataUrl)
      };
    } catch (error) {
      console.error('[CameraHelper] Error selecting photo:', error);
      throw error;
    }
  }

  /**
   * Prompt user to choose between camera or gallery
   */
  async getPhoto(options = {}) {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Camera/Photos permission denied');
        }
      }

      const photo = await Camera.getPhoto({
        quality: options.quality || this.defaultQuality,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // User chooses camera or gallery
        width: options.width || this.maxWidth,
        height: options.height || this.maxHeight,
        correctOrientation: true,
        saveToGallery: options.saveToGallery || false,
        promptLabelHeader: 'Select Photo',
        promptLabelCancel: 'Cancel',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take Photo'
      });

      console.log('[CameraHelper] Photo captured/selected successfully');

      return {
        dataUrl: photo.dataUrl,
        format: photo.format,
        saved: photo.saved || false,
        timestamp: Date.now(),
        size: this.estimateSize(photo.dataUrl)
      };
    } catch (error) {
      console.error('[CameraHelper] Error getting photo:', error);
      throw error;
    }
  }

  /**
   * Compress a photo if it's too large
   */
  async compressPhoto(dataUrl, targetQuality = 80) {
    try {
      // Check if photo needs compression
      const size = this.estimateSize(dataUrl);
      if (size < 500 * 1024) { // Less than 500KB
        console.log('[CameraHelper] Photo size OK, no compression needed');
        return dataUrl;
      }

      // For web-based compression, we'd use canvas
      // This is a placeholder for the actual compression logic
      console.log('[CameraHelper] Photo compression would be applied here');
      
      // In a real implementation, you would:
      // 1. Create an Image element
      // 2. Draw it to a canvas with reduced quality
      // 3. Export as data URL with lower quality
      
      return dataUrl;
    } catch (error) {
      console.error('[CameraHelper] Error compressing photo:', error);
      return dataUrl; // Return original if compression fails
    }
  }

  /**
   * Estimate the size of a base64 data URL in bytes
   */
  estimateSize(dataUrl) {
    if (!dataUrl) return 0;
    
    // Remove data URL prefix
    const base64 = dataUrl.split(',')[1] || dataUrl;
    
    // Calculate size (base64 is ~4/3 the size of binary)
    const padding = (base64.match(/=/g) || []).length;
    const size = (base64.length * 3 / 4) - padding;
    
    return size;
  }

  /**
   * Format size for display
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Get multiple photos
   */
  async getMultiplePhotos(count = 5, options = {}) {
    const photos = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const photo = await this.getPhoto(options);
        photos.push(photo);
        
        // Check if user wants to add more
        if (photos.length < count) {
          const addMore = confirm(`Photo ${i + 1} added. Add another photo?`);
          if (!addMore) break;
        }
      } catch (error) {
        if (error.message === 'User cancelled photos app') {
          break; // User cancelled, stop asking
        }
        console.error('[CameraHelper] Error getting photo:', error);
        break;
      }
    }
    
    return photos;
  }

  /**
   * Validate photo data
   */
  validatePhoto(photo) {
    if (!photo || !photo.dataUrl) {
      return { valid: false, error: 'Invalid photo data' };
    }

    const size = this.estimateSize(photo.dataUrl);
    if (size > 10 * 1024 * 1024) { // 10MB limit
      return { valid: false, error: 'Photo too large (max 10MB)' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const cameraHelper = new CameraHelper();
export default cameraHelper;
