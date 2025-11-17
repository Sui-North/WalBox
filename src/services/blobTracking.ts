// Blob Tracking Service
// High-level service for managing Walrus blob metadata

import type { BlobMetadata, BlobStatus, ContentTypeCategory } from '@/types/walrus';
import { blobTrackingDb } from './blobTrackingDb';

/**
 * Service for tracking and querying Walrus blob metadata
 */
export class BlobTrackingService {
  /**
   * Track a new blob
   */
  async trackBlob(metadata: BlobMetadata): Promise<void> {
    try {
      await blobTrackingDb.put(metadata);
      console.log(`✅ Tracked blob: ${metadata.blobId}`);
    } catch (error) {
      console.error('Failed to track blob:', error);
      // Fallback to localStorage
      this.fallbackToLocalStorage(metadata);
      throw error;
    }
  }

  /**
   * Get blob metadata by ID
   */
  async getBlobMetadata(blobId: string): Promise<BlobMetadata | null> {
    try {
      return await blobTrackingDb.get(blobId);
    } catch (error) {
      console.error('Failed to get blob metadata:', error);
      // Try localStorage fallback
      return this.getFromLocalStorage(blobId);
    }
  }

  /**
   * Get all tracked blobs
   */
  async getAllBlobs(): Promise<BlobMetadata[]> {
    try {
      const blobs = await blobTrackingDb.getAll();
      // Update status for all blobs
      return blobs.map(blob => ({
        ...blob,
        status: this.calculateStatus(blob)
      }));
    } catch (error) {
      console.error('Failed to get all blobs:', error);
      return [];
    }
  }

  /**
   * Update blob metadata (partial update)
   */
  async updateBlobMetadata(blobId: string, updates: Partial<BlobMetadata>): Promise<void> {
    try {
      await blobTrackingDb.update(blobId, updates);
      console.log(`✅ Updated blob: ${blobId}`);
    } catch (error) {
      console.error('Failed to update blob metadata:', error);
      throw error;
    }
  }

  /**
   * Delete blob metadata
   */

  async deleteBlobMetadata(blobId: string): Promise<void> {
    try {
      await blobTrackingDb.delete(blobId);
      console.log(`✅ Deleted blob metadata: ${blobId}`);
    } catch (error) {
      console.error('Failed to delete blob metadata:', error);
      throw error;
    }
  }

  /**
   * Get blobs by content type
   */
  async getBlobsByContentType(type: ContentTypeCategory): Promise<BlobMetadata[]> {
    try {
      const blobs = await blobTrackingDb.getByIndex('contentType', type);
      return blobs.map(blob => ({
        ...blob,
        status: this.calculateStatus(blob)
      }));
    } catch (error) {
      console.error('Failed to get blobs by content type:', error);
      return [];
    }
  }

  /**
   * Get blobs by status
   */
  async getBlobsByStatus(status: BlobStatus): Promise<BlobMetadata[]> {
    try {
      const allBlobs = await this.getAllBlobs();
      return allBlobs.filter(blob => blob.status === status);
    } catch (error) {
      console.error('Failed to get blobs by status:', error);
      return [];
    }
  }

  /**
   * Get blobs by date range
   */
  async getBlobsByDateRange(start: Date, end: Date): Promise<BlobMetadata[]> {
    try {
      const allBlobs = await this.getAllBlobs();
      return allBlobs.filter(blob => {
        const uploadDate = new Date(blob.uploadedAt);
        return uploadDate >= start && uploadDate <= end;
      });
    } catch (error) {
      console.error('Failed to get blobs by date range:', error);
      return [];
    }
  }

  /**
   * Search blobs by query
   */
  async searchBlobs(query: string): Promise<BlobMetadata[]> {
    try {
      const allBlobs = await this.getAllBlobs();
      const lowerQuery = query.toLowerCase();
      
      return allBlobs.filter(blob => {
        return (
          blob.fileName.toLowerCase().includes(lowerQuery) ||
          blob.blobId.toLowerCase().includes(lowerQuery) ||
          blob.contentType.toLowerCase().includes(lowerQuery)
        );
      });
    } catch (error) {
      console.error('Failed to search blobs:', error);
      return [];
    }
  }

  /**
   * Get total storage used
   */
  async getTotalStorageUsed(): Promise<number> {
    try {
      const blobs = await this.getAllBlobs();
      return blobs.reduce((total, blob) => total + blob.encodedSize, 0);
    } catch (error) {
      console.error('Failed to get total storage:', error);
      return 0;
    }
  }

  /**
   * Get total storage cost
   */
  async getTotalStorageCost(): Promise<number> {
    try {
      const blobs = await this.getAllBlobs();
      return blobs.reduce((total, blob) => total + blob.storageCost, 0);
    } catch (error) {
      console.error('Failed to get total cost:', error);
      return 0;
    }
  }

  /**
   * Get storage by content type
   */
  async getStorageByContentType(): Promise<Record<ContentTypeCategory, number>> {
    try {
      const blobs = await this.getAllBlobs();
      const storage: Record<string, number> = {
        image: 0,
        video: 0,
        audio: 0,
        document: 0,
        archive: 0,
        other: 0
      };

      for (const blob of blobs) {
        storage[blob.contentType] += blob.encodedSize;
      }

      return storage as Record<ContentTypeCategory, number>;
    } catch (error) {
      console.error('Failed to get storage by content type:', error);
      return { image: 0, video: 0, audio: 0, document: 0, archive: 0, other: 0 };
    }
  }

  /**
   * Get upload trend for the last N days
   */
  async getUploadTrend(days: number): Promise<Array<{ date: Date; count: number; size: number }>> {
    try {
      const blobs = await this.getAllBlobs();
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Filter blobs within date range
      const recentBlobs = blobs.filter(blob => {
        const uploadDate = new Date(blob.uploadedAt);
        return uploadDate >= startDate;
      });

      // Group by date
      const trendMap = new Map<string, { count: number; size: number }>();
      
      for (const blob of recentBlobs) {
        const dateKey = new Date(blob.uploadedAt).toISOString().split('T')[0];
        const existing = trendMap.get(dateKey) || { count: 0, size: 0 };
        trendMap.set(dateKey, {
          count: existing.count + 1,
          size: existing.size + blob.encodedSize
        });
      }

      // Convert to array and sort by date
      return Array.from(trendMap.entries())
        .map(([dateStr, data]) => ({
          date: new Date(dateStr),
          count: data.count,
          size: data.size
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error('Failed to get upload trend:', error);
      return [];
    }
  }

  /**
   * Find duplicate blobs by content hash
   */
  async findDuplicates(contentHash: string): Promise<BlobMetadata[]> {
    try {
      const blobs = await blobTrackingDb.getByIndex('contentHash', contentHash);
      return blobs;
    } catch (error) {
      console.error('Failed to find duplicates:', error);
      return [];
    }
  }

  /**
   * Calculate blob status based on expiration date
   */
  private calculateStatus(blob: BlobMetadata): BlobStatus {
    const now = new Date();
    const expiresAt = new Date(blob.expiresAt);
    const daysUntilExpiration = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiration < 0) {
      return 'expired';
    } else if (daysUntilExpiration <= 7) {
      return 'expiring';
    } else {
      return 'active';
    }
  }

  /**
   * Fallback to localStorage when IndexedDB fails
   */
  private fallbackToLocalStorage(metadata: BlobMetadata): void {
    try {
      const minimal = {
        blobId: metadata.blobId,
        fileName: metadata.fileName,
        uploadedAt: metadata.uploadedAt.toISOString(),
        status: metadata.status
      };
      localStorage.setItem(`blob_${metadata.blobId}`, JSON.stringify(minimal));
      console.warn('⚠️ Stored minimal metadata in localStorage');
    } catch (error) {
      console.error('Failed to store in localStorage:', error);
    }
  }

  /**
   * Get from localStorage fallback
   */
  private getFromLocalStorage(blobId: string): BlobMetadata | null {
    try {
      const data = localStorage.getItem(`blob_${blobId}`);
      if (!data) return null;
      
      const minimal = JSON.parse(data);
      // Return minimal metadata structure
      return {
        ...minimal,
        uploadedAt: new Date(minimal.uploadedAt),
        // Fill in missing required fields with defaults
        fileId: '',
        objectId: '',
        originalSize: 0,
        encryptedSize: 0,
        encodedSize: 0,
        mimeType: '',
        contentType: 'other',
        walrusResponse: {} as any,
        storageCost: 0,
        storageEpochs: 0,
        uploadEpoch: 0,
        expirationEpoch: 0,
        aggregatorUrl: '',
        walrusScanUrl: '',
        expiresAt: new Date(),
        downloadCount: 0,
        reuseCount: 0
      };
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  }
}

// Singleton instance
export const blobTrackingService = new BlobTrackingService();
