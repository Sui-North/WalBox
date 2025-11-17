// Content Processors for extracting metadata from different file types
// Handles images, videos, and audio files

import type { ImageMetadata, VideoMetadata, AudioMetadata } from '@/types/walrus';

/**
 * Image metadata processor
 */
export class ImageProcessor {
  /**
   * Extract metadata from image file
   */
  async extractMetadata(file: File): Promise<ImageMetadata> {
    try {
      const img = await this.loadImage(file);
      
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: this.detectFormat(file.type),
        hasAlpha: await this.detectAlpha(img, file.type),
        // EXIF extraction would require additional library
        // For now, we'll leave it undefined
        exif: undefined
      };
    } catch (error) {
      console.error('Failed to extract image metadata:', error);
      // Return minimal metadata on error
      return {
        width: 0,
        height: 0,
        format: this.detectFormat(file.type),
        hasAlpha: false
      };
    }
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Detect image format from MIME type
   */
  private detectFormat(mimeType: string): string {
    const formatMap: Record<string, string> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/x-icon': 'ico'
    };
    
    return formatMap[mimeType] || 'unknown';
  }

  /**
   * Detect if image has alpha channel
   */
  private async detectAlpha(img: HTMLImageElement, mimeType: string): Promise<boolean> {
    // PNG and WebP can have alpha, JPEG cannot
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return false;
    }
    
    if (mimeType === 'image/png' || mimeType === 'image/webp') {
      // For PNG/WebP, we'd need to check the actual image data
      // This is a simplified check
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.naturalWidth, 100);
        canvas.height = Math.min(img.naturalHeight, 100);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return false;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if any pixel has alpha < 255
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] < 255) {
            return true;
          }
        }
        
        return false;
      } catch (error) {
        // If we can't check, assume it might have alpha
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Video metadata processor
 */
export class VideoProcessor {
  /**
   * Extract metadata from video file
   */
  async extractMetadata(file: File): Promise<VideoMetadata> {
    try {
      const video = await this.loadVideo(file);
      
      return {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        resolution: this.calculateResolution(video.videoHeight),
        codec: 'unknown', // Would need MediaSource API or server-side processing
        bitrate: Math.round((file.size / video.duration) * 8), // Approximate bitrate in bps
        frameRate: 30, // Default assumption, would need deeper analysis
        audioCodec: undefined // Would need MediaSource API
      };
    } catch (error) {
      console.error('Failed to extract video metadata:', error);
      // Return minimal metadata on error
      return {
        duration: 0,
        width: 0,
        height: 0,
        resolution: 'unknown',
        codec: 'unknown',
        bitrate: 0,
        frameRate: 0
      };
    }
  }

  /**
   * Load video from file
   */
  private loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };
      
      video.src = url;
    });
  }

  /**
   * Calculate resolution label from height
   */
  private calculateResolution(height: number): string {
    if (height >= 2160) return '4K';
    if (height >= 1440) return '1440p';
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    if (height >= 360) return '360p';
    return '240p';
  }
}

/**
 * Audio metadata processor
 */
export class AudioProcessor {
  /**
   * Extract metadata from audio file
   */
  async extractMetadata(file: File): Promise<AudioMetadata> {
    try {
      const audio = await this.loadAudio(file);
      
      return {
        duration: audio.duration,
        bitrate: Math.round((file.size / audio.duration) * 8), // Approximate bitrate in bps
        sampleRate: 44100, // Default assumption
        channels: 2, // Default assumption (stereo)
        codec: 'unknown' // Would need deeper analysis
      };
    } catch (error) {
      console.error('Failed to extract audio metadata:', error);
      // Return minimal metadata on error
      return {
        duration: 0,
        bitrate: 0,
        sampleRate: 0,
        channels: 0,
        codec: 'unknown'
      };
    }
  }

  /**
   * Load audio from file
   */
  private loadAudio(file: File): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio'));
      };
      
      audio.src = url;
    });
  }
}

// Singleton instances
export const imageProcessor = new ImageProcessor();
export const videoProcessor = new VideoProcessor();
export const audioProcessor = new AudioProcessor();
