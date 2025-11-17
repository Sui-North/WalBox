# Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing WalrusBox's Walrus integration with comprehensive tracking, analytics, and management capabilities. The design focuses on creating a robust metadata tracking system stored in IndexedDB, content-type specific features, cost analytics, and seamless integration with existing WalrusBox functionality.

### Design Principles

1. **Comprehensive Tracking**: Capture all relevant metadata from Walrus responses
2. **Offline-First**: Store metadata in IndexedDB for fast access and offline capability
3. **Type-Aware**: Provide specialized features for images, videos, and documents
4. **Cost-Conscious**: Track and project storage costs to help users optimize spending
5. **Non-Intrusive**: Integrate seamlessly without disrupting existing workflows

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WalrusBox Frontend                       │
│  ┌────────────┬────────────┬────────────┬─────────────────┐ │
│  │ UI Layer   │ Tracking   │ Analytics  │ Content         │ │
│  │ Components │ Service    │ Service    │ Processors      │ │
│  └────────────┴────────────┴────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Walrus       │  │ IndexedDB    │  │ LocalStorage │
    │ Network      │  │ Blob         │  │ Quick        │
    │ - Upload     │  │ Metadata     │  │ Access       │
    │ - Download   │  │ Store        │  │ Cache        │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

**Upload Flow with Tracking**:
1. User selects file → Extract metadata (size, type, dimensions)
2. Encrypt file → Upload to Walrus
3. Receive Walrus response → Extract blob ID, cost, encoded size
4. Store comprehensive metadata in IndexedDB
5. Create FileObject on Sui blockchain
6. Update UI with tracking information

**Analytics Flow**:
1. Query IndexedDB for all blob metadata
2. Aggregate by content type, date, size ranges
3. Calculate totals and trends
4. Render charts and statistics
5. Cache results for performance

## Components and Interfaces

### 1. Enhanced Blob Metadata Model


**Core Data Structure**:
```typescript
interface BlobMetadata {
  // Core identifiers
  blobId: string;
  fileId: string; // Link to Sui FileObject
  objectId: string; // Sui object ID
  
  // File information
  fileName: string;
  originalSize: number; // Size before encryption
  encryptedSize: number; // Size after encryption
  encodedSize: number; // Size after Walrus encoding
  mimeType: string;
  contentType: ContentTypeCategory; // 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'
  
  // Walrus specific
  walrusResponse: WalrusUploadResponse;
  storageCost: number; // In SUI tokens
  storageEpochs: number;
  uploadEpoch: number;
  expirationEpoch: number;
  transactionDigest?: string;
  
  // URLs
  aggregatorUrl: string;
  walrusScanUrl: string;
  
  // Timestamps
  uploadedAt: Date;
  expiresAt: Date;
  lastVerified?: Date;
  
  // Status
  status: 'active' | 'expiring' | 'expired' | 'failed';
  verificationStatus?: 'verified' | 'failed' | 'pending';
  
  // Content-specific metadata
  imageMetadata?: ImageMetadata;
  videoMetadata?: VideoMetadata;
  audioMetadata?: AudioMetadata;
  
  // Usage tracking
  downloadCount: number;
  lastAccessed?: Date;
  reuseCount: number; // How many files share this blob
  contentHash?: string; // For duplicate detection
}

interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
      storage: { id: string; startEpoch: string; endEpoch: string };
      encodedSize: string;
    };
    encodedLength: string;
    cost: string;
  };
  alreadyCertified?: {
    blobId: string;
    event: { txDigest: string; eventSeq: string };
    endEpoch: string;
  };
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string; // 'jpeg', 'png', 'gif', 'webp', etc.
  hasAlpha: boolean;
  exif?: {
    camera?: string;
    dateTaken?: Date;
    location?: { lat: number; lng: number };
    orientation?: number;
  };
}

interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  resolution: string; // '720p', '1080p', '4K', etc.
  codec: string; // 'h264', 'h265', 'vp9', etc.
  bitrate: number;
  frameRate: number;
  audioCodec?: string;
}

interface AudioMetadata {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
}
```

### 2. Blob Tracking Service

**Service Interface**:
```typescript
class BlobTrackingService {
  // Core tracking operations
  async trackBlob(metadata: BlobMetadata): Promise<void>;
  async getBlobMetadata(blobId: string): Promise<BlobMetadata | null>;
  async getAllBlobs(): Promise<BlobMetadata[]>;
  async updateBlobMetadata(blobId: string, updates: Partial<BlobMetadata>): Promise<void>;
  async deleteBlobMetadata(blobId: string): Promise<void>;
  
  // Query operations
  async getBlobsByContentType(type: ContentTypeCategory): Promise<BlobMetadata[]>;
  async getBlobsByStatus(status: BlobMetadata['status']): Promise<BlobMetadata[]>;
  async getBlobsByDateRange(start: Date, end: Date): Promise<BlobMetadata[]>;
  async searchBlobs(query: string): Promise<BlobMetadata[]>;
  
  // Analytics operations
  async getTotalStorageUsed(): Promise<number>;
  async getTotalStorageCost(): Promise<number>;
  async getStorageByContentType(): Promise<Record<ContentTypeCategory, number>>;
  async getUploadTrend(days: number): Promise<Array<{ date: Date; count: number; size: number }>>;
  
  // Verification operations
  async verifyBlob(blobId: string): Promise<boolean>;
  async verifyAllBlobs(): Promise<VerificationReport>;
  
  // Duplicate detection
  async findDuplicates(contentHash: string): Promise<BlobMetadata[]>;
  async calculateContentHash(file: File): Promise<string>;
}
```

**IndexedDB Schema**:
```typescript
const DB_NAME = 'walrusbox_tracking';
const DB_VERSION = 1;

const stores = {
  blobs: {
    keyPath: 'blobId',
    indexes: [
      { name: 'fileId', keyPath: 'fileId', unique: false },
      { name: 'contentType', keyPath: 'contentType', unique: false },
      { name: 'uploadedAt', keyPath: 'uploadedAt', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'contentHash', keyPath: 'contentHash', unique: false },
    ]
  },
  analytics: {
    keyPath: 'id',
    // Cached analytics data with TTL
  }
};
```

### 3. Content Type Processors

**Image Processor**:
```typescript
class ImageProcessor {
  async extractMetadata(file: File): Promise<ImageMetadata> {
    const img = await this.loadImage(file);
    const exif = await this.extractExif(file);
    
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: this.detectFormat(file.type),
      hasAlpha: await this.detectAlpha(img),
      exif: exif ? {
        camera: exif.Model,
        dateTaken: exif.DateTimeOriginal,
        location: exif.GPSLatitude ? {
          lat: exif.GPSLatitude,
          lng: exif.GPSLongitude
        } : undefined,
        orientation: exif.Orientation
      } : undefined
    };
  }
  
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  
  private async extractExif(file: File): Promise<any> {
    // Use exif-js or similar library
    // Return null if no EXIF data
  }
}
```

**Video Processor**:
```typescript
class VideoProcessor {
  async extractMetadata(file: File): Promise<VideoMetadata> {
    const video = await this.loadVideo(file);
    
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      resolution: this.calculateResolution(video.videoHeight),
      codec: 'unknown', // Would need MediaSource API or server-side processing
      bitrate: file.size / video.duration * 8, // Approximate
      frameRate: 30, // Default, would need deeper analysis
      audioCodec: undefined // Would need MediaSource API
    };
  }
  
  private async loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve(video);
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }
  
  private calculateResolution(height: number): string {
    if (height >= 2160) return '4K';
    if (height >= 1440) return '1440p';
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    return '360p';
  }
}
```

### 4. Analytics Service


**Analytics Data Models**:
```typescript
interface StorageAnalytics {
  summary: {
    totalBlobs: number;
    totalStorage: number; // bytes
    totalCost: number; // SUI
    activeBlobs: number;
    expiringBlobs: number;
    expiredBlobs: number;
  };
  
  byContentType: Array<{
    type: ContentTypeCategory;
    count: number;
    storage: number;
    cost: number;
    percentage: number;
  }>;
  
  bySizeRange: Array<{
    range: string; // '< 1MB', '1-10MB', etc.
    count: number;
    storage: number;
  }>;
  
  uploadTrend: Array<{
    date: Date;
    count: number;
    storage: number;
    cost: number;
  }>;
  
  topFiles: Array<{
    blobId: string;
    fileName: string;
    size: number;
    percentage: number;
  }>;
  
  costProjection: {
    currentMonthly: number;
    projectedMonthly: number;
    averagePerBlob: number;
    averagePerGB: number;
  };
}

interface VerificationReport {
  totalBlobs: number;
  verified: number;
  failed: number;
  pending: number;
  failedBlobs: Array<{
    blobId: string;
    fileName: string;
    error: string;
  }>;
}
```

**Analytics Service Implementation**:
```typescript
class WalrusAnalyticsService {
  constructor(private trackingService: BlobTrackingService) {}
  
  async generateAnalytics(): Promise<StorageAnalytics> {
    const allBlobs = await this.trackingService.getAllBlobs();
    
    return {
      summary: this.calculateSummary(allBlobs),
      byContentType: this.groupByContentType(allBlobs),
      bySizeRange: this.groupBySizeRange(allBlobs),
      uploadTrend: await this.calculateUploadTrend(allBlobs),
      topFiles: this.getTopFiles(allBlobs, 10),
      costProjection: this.projectCosts(allBlobs)
    };
  }
  
  private calculateSummary(blobs: BlobMetadata[]) {
    return {
      totalBlobs: blobs.length,
      totalStorage: blobs.reduce((sum, b) => sum + b.encodedSize, 0),
      totalCost: blobs.reduce((sum, b) => sum + b.storageCost, 0),
      activeBlobs: blobs.filter(b => b.status === 'active').length,
      expiringBlobs: blobs.filter(b => b.status === 'expiring').length,
      expiredBlobs: blobs.filter(b => b.status === 'expired').length,
    };
  }
  
  private groupByContentType(blobs: BlobMetadata[]) {
    const groups = new Map<ContentTypeCategory, BlobMetadata[]>();
    
    for (const blob of blobs) {
      const existing = groups.get(blob.contentType) || [];
      groups.set(blob.contentType, [...existing, blob]);
    }
    
    const totalStorage = blobs.reduce((sum, b) => sum + b.encodedSize, 0);
    
    return Array.from(groups.entries()).map(([type, typeBlobs]) => {
      const storage = typeBlobs.reduce((sum, b) => sum + b.encodedSize, 0);
      return {
        type,
        count: typeBlobs.length,
        storage,
        cost: typeBlobs.reduce((sum, b) => sum + b.storageCost, 0),
        percentage: (storage / totalStorage) * 100
      };
    });
  }
  
  private projectCosts(blobs: BlobMetadata[]) {
    const totalCost = blobs.reduce((sum, b) => sum + b.storageCost, 0);
    const activeBlobs = blobs.filter(b => b.status === 'active');
    const totalStorage = activeBlobs.reduce((sum, b) => sum + b.encodedSize, 0);
    
    // Estimate monthly cost based on average epoch duration
    const avgEpochDuration = 30; // days (approximate)
    const avgStorageEpochs = activeBlobs.reduce((sum, b) => sum + b.storageEpochs, 0) / activeBlobs.length;
    const monthlyMultiplier = 30 / (avgEpochDuration * avgStorageEpochs);
    
    return {
      currentMonthly: totalCost * monthlyMultiplier,
      projectedMonthly: totalCost * monthlyMultiplier * 1.1, // 10% growth assumption
      averagePerBlob: totalCost / blobs.length,
      averagePerGB: totalCost / (totalStorage / 1e9)
    };
  }
}
```

### 5. UI Components

**Walrus Analytics Dashboard**:
```typescript
interface WalrusAnalyticsDashboardProps {
  analytics: StorageAnalytics;
  onRefresh: () => void;
}

// Component displays:
// - Summary cards (total blobs, storage, cost)
// - Content type pie chart (Recharts)
// - Upload trend line chart
// - Top files list
// - Cost projection cards
```

**Blob Details Panel**:
```typescript
interface BlobDetailsPanelProps {
  blob: BlobMetadata;
  onVerify: (blobId: string) => void;
  onViewOnWalrusScan: (url: string) => void;
}

// Component displays:
// - Basic info (filename, size, type)
// - Walrus info (blob ID, cost, epochs)
// - Status indicators (active/expiring/expired)
// - Action buttons (verify, view on Walrus Scan, download)
// - Content-specific metadata (dimensions for images, duration for videos)
```

**Content Type Gallery**:
```typescript
interface ContentTypeGalleryProps {
  contentType: ContentTypeCategory;
  blobs: BlobMetadata[];
  onBlobClick: (blobId: string) => void;
}

// For images: Grid of thumbnails loaded from Walrus
// For videos: Grid with video thumbnails and duration overlay
// For documents: List view with file icons
```

### 6. Blob Verification System

**Verification Service**:
```typescript
class BlobVerificationService {
  constructor(
    private trackingService: BlobTrackingService,
    private storageService: StorageService
  ) {}
  
  async verifyBlob(blobId: string): Promise<VerificationResult> {
    const startTime = Date.now();
    
    try {
      const metadata = await this.trackingService.getBlobMetadata(blobId);
      if (!metadata) {
        return { success: false, error: 'Blob metadata not found' };
      }
      
      // Attempt to fetch blob from aggregator
      const response = await fetch(metadata.aggregatorUrl, {
        method: 'HEAD' // Use HEAD to avoid downloading entire blob
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        // Update verification status
        await this.trackingService.updateBlobMetadata(blobId, {
          verificationStatus: 'verified',
          lastVerified: new Date()
        });
        
        return {
          success: true,
          responseTime,
          size: parseInt(response.headers.get('content-length') || '0')
        };
      } else {
        await this.trackingService.updateBlobMetadata(blobId, {
          verificationStatus: 'failed'
        });
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async verifyAllBlobs(
    onProgress?: (current: number, total: number) => void
  ): Promise<VerificationReport> {
    const allBlobs = await this.trackingService.getAllBlobs();
    const results: VerificationReport = {
      totalBlobs: allBlobs.length,
      verified: 0,
      failed: 0,
      pending: 0,
      failedBlobs: []
    };
    
    for (let i = 0; i < allBlobs.length; i++) {
      const blob = allBlobs[i];
      const result = await this.verifyBlob(blob.blobId);
      
      if (result.success) {
        results.verified++;
      } else {
        results.failed++;
        results.failedBlobs.push({
          blobId: blob.blobId,
          fileName: blob.fileName,
          error: result.error || 'Unknown error'
        });
      }
      
      onProgress?.(i + 1, allBlobs.length);
      
      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

interface VerificationResult {
  success: boolean;
  responseTime?: number;
  size?: number;
  error?: string;
}
```

### 7. Duplicate Detection System

**Content Hash Service**:
```typescript
class ContentHashService {
  async calculateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async findDuplicates(
    hash: string,
    trackingService: BlobTrackingService
  ): Promise<BlobMetadata[]> {
    const allBlobs = await trackingService.getAllBlobs();
    return allBlobs.filter(b => b.contentHash === hash);
  }
}
```

**Duplicate Detection Flow**:
1. Before upload, calculate content hash of file
2. Query IndexedDB for existing blobs with same hash
3. If duplicates found, show modal with options:
   - Upload new copy (costs storage)
   - Reuse existing blob (free, just create new FileObject)
   - View existing files using this blob
4. If user chooses reuse, increment reuseCount on existing blob
5. Create new FileObject pointing to existing blob ID

### 8. Storage Optimization Recommendations


**Optimization Analyzer**:
```typescript
interface OptimizationRecommendation {
  type: 'compress' | 'deduplicate' | 'remove_expired' | 'extend_storage';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number; // in SUI
  affectedBlobs: string[];
  action: () => Promise<void>;
}

class StorageOptimizationService {
  async analyzeStorage(
    blobs: BlobMetadata[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Find large uncompressed images
    const largeImages = blobs.filter(b => 
      b.contentType === 'image' && 
      b.originalSize > 5 * 1024 * 1024 && // > 5MB
      b.imageMetadata?.format !== 'webp'
    );
    
    if (largeImages.length > 0) {
      recommendations.push({
        type: 'compress',
        priority: 'high',
        title: `Compress ${largeImages.length} large images`,
        description: 'Convert to WebP format to reduce storage by ~30-50%',
        potentialSavings: this.estimateCompressionSavings(largeImages),
        affectedBlobs: largeImages.map(b => b.blobId),
        action: async () => {
          // Implementation would re-upload compressed versions
        }
      });
    }
    
    // Find duplicates
    const duplicateGroups = this.findDuplicateGroups(blobs);
    if (duplicateGroups.length > 0) {
      const duplicateBlobs = duplicateGroups.flatMap(g => g.slice(1));
      recommendations.push({
        type: 'deduplicate',
        priority: 'high',
        title: `Remove ${duplicateBlobs.length} duplicate files`,
        description: 'Consolidate duplicate files to save storage costs',
        potentialSavings: duplicateBlobs.reduce((sum, b) => sum + b.storageCost, 0),
        affectedBlobs: duplicateBlobs.map(b => b.blobId),
        action: async () => {
          // Implementation would update FileObjects to point to single blob
        }
      });
    }
    
    // Find expired blobs
    const expiredBlobs = blobs.filter(b => b.status === 'expired');
    if (expiredBlobs.length > 0) {
      recommendations.push({
        type: 'remove_expired',
        priority: 'medium',
        title: `Clean up ${expiredBlobs.length} expired files`,
        description: 'Remove expired files to clean up your storage',
        potentialSavings: 0, // Already expired, no cost savings
        affectedBlobs: expiredBlobs.map(b => b.blobId),
        action: async () => {
          // Implementation would delete FileObjects and metadata
        }
      });
    }
    
    // Find expiring blobs
    const expiringBlobs = blobs.filter(b => b.status === 'expiring');
    if (expiringBlobs.length > 0) {
      recommendations.push({
        type: 'extend_storage',
        priority: 'high',
        title: `Extend storage for ${expiringBlobs.length} expiring files`,
        description: 'Files will become inaccessible soon',
        potentialSavings: 0,
        affectedBlobs: expiringBlobs.map(b => b.blobId),
        action: async () => {
          // Implementation would re-upload to extend storage
        }
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  private findDuplicateGroups(blobs: BlobMetadata[]): BlobMetadata[][] {
    const hashMap = new Map<string, BlobMetadata[]>();
    
    for (const blob of blobs) {
      if (blob.contentHash) {
        const existing = hashMap.get(blob.contentHash) || [];
        hashMap.set(blob.contentHash, [...existing, blob]);
      }
    }
    
    return Array.from(hashMap.values()).filter(group => group.length > 1);
  }
  
  private estimateCompressionSavings(blobs: BlobMetadata[]): number {
    // Estimate 40% size reduction on average
    const totalSize = blobs.reduce((sum, b) => sum + b.encodedSize, 0);
    const avgCostPerByte = blobs.reduce((sum, b) => sum + b.storageCost, 0) / totalSize;
    return totalSize * 0.4 * avgCostPerByte;
  }
}
```

### 9. Export and Reporting

**Report Generator**:
```typescript
interface StorageReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: StorageAnalytics['summary'];
  details: {
    byContentType: StorageAnalytics['byContentType'];
    topFiles: StorageAnalytics['topFiles'];
    costProjection: StorageAnalytics['costProjection'];
  };
  blobList: Array<{
    fileName: string;
    blobId: string;
    size: number;
    cost: number;
    uploadedAt: Date;
    status: string;
  }>;
}

class ReportGeneratorService {
  async generateCSV(blobs: BlobMetadata[]): Promise<string> {
    const headers = [
      'Blob ID',
      'File Name',
      'Content Type',
      'Size (bytes)',
      'Encoded Size (bytes)',
      'Cost (SUI)',
      'Storage Epochs',
      'Uploaded At',
      'Expires At',
      'Status',
      'Walrus Scan URL'
    ];
    
    const rows = blobs.map(b => [
      b.blobId,
      b.fileName,
      b.contentType,
      b.originalSize.toString(),
      b.encodedSize.toString(),
      b.storageCost.toString(),
      b.storageEpochs.toString(),
      b.uploadedAt.toISOString(),
      b.expiresAt.toISOString(),
      b.status,
      b.walrusScanUrl
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  
  async generateJSON(analytics: StorageAnalytics, blobs: BlobMetadata[]): Promise<string> {
    const report: StorageReport = {
      generatedAt: new Date(),
      period: {
        start: new Date(Math.min(...blobs.map(b => b.uploadedAt.getTime()))),
        end: new Date()
      },
      summary: analytics.summary,
      details: {
        byContentType: analytics.byContentType,
        topFiles: analytics.topFiles,
        costProjection: analytics.costProjection
      },
      blobList: blobs.map(b => ({
        fileName: b.fileName,
        blobId: b.blobId,
        size: b.encodedSize,
        cost: b.storageCost,
        uploadedAt: b.uploadedAt,
        status: b.status
      }))
    };
    
    return JSON.stringify(report, null, 2);
  }
}
```

### 10. Integration with Existing Services

**Enhanced Storage Service**:
```typescript
// Extend existing StorageService
class EnhancedStorageService extends StorageService {
  constructor(
    private trackingService: BlobTrackingService,
    private contentHashService: ContentHashService,
    private imageProcessor: ImageProcessor,
    private videoProcessor: VideoProcessor
  ) {
    super();
  }
  
  async uploadToWalrus(blob: Blob, fileName: string): Promise<Uint8Array> {
    // Calculate content hash for duplicate detection
    const file = new File([blob], fileName);
    const contentHash = await this.contentHashService.calculateHash(file);
    
    // Check for duplicates
    const duplicates = await this.trackingService.findDuplicates(contentHash);
    if (duplicates.length > 0) {
      // Notify user of duplicate (handled by UI)
      console.log(`Found ${duplicates.length} duplicate(s)`);
    }
    
    // Extract content-specific metadata
    let imageMetadata: ImageMetadata | undefined;
    let videoMetadata: VideoMetadata | undefined;
    
    if (file.type.startsWith('image/')) {
      imageMetadata = await this.imageProcessor.extractMetadata(file);
    } else if (file.type.startsWith('video/')) {
      videoMetadata = await this.videoProcessor.extractMetadata(file);
    }
    
    // Upload to Walrus (existing logic)
    const hashBytes = await super.uploadToWalrus(blob, fileName);
    
    // Extract blob ID from response
    const blobId = this.bytesToHash(hashBytes);
    
    // Get Walrus response from last upload (would need to modify parent class)
    const walrusResponse = this.getLastWalrusResponse();
    
    // Calculate storage details
    const storageCost = walrusResponse.newlyCreated 
      ? parseFloat(walrusResponse.newlyCreated.cost)
      : 0;
    const encodedSize = walrusResponse.newlyCreated
      ? parseInt(walrusResponse.newlyCreated.encodedLength)
      : blob.size;
    const storageEpochs = 5; // From upload parameters
    
    // Track comprehensive metadata
    await this.trackingService.trackBlob({
      blobId,
      fileId: '', // Will be set after FileObject creation
      objectId: '', // Will be set after FileObject creation
      fileName,
      originalSize: file.size,
      encryptedSize: blob.size,
      encodedSize,
      mimeType: file.type,
      contentType: this.categorizeContentType(file.type),
      walrusResponse,
      storageCost,
      storageEpochs,
      uploadEpoch: 0, // Would need to query current epoch
      expirationEpoch: storageEpochs,
      aggregatorUrl: `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`,
      walrusScanUrl: `https://walrus-testnet-explorer.walrus.space/blob/${blobId}`,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + storageEpochs * 30 * 24 * 60 * 60 * 1000), // Approximate
      status: 'active',
      imageMetadata,
      videoMetadata,
      downloadCount: 0,
      reuseCount: 0,
      contentHash
    });
    
    return hashBytes;
  }
  
  private categorizeContentType(mimeType: string): ContentTypeCategory {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
    return 'other';
  }
}
```

## Data Models

### IndexedDB Schema Details

```typescript
// Database structure
const schema = {
  name: 'walrusbox_tracking',
  version: 1,
  stores: {
    blobs: {
      keyPath: 'blobId',
      indexes: [
        { name: 'fileId', keyPath: 'fileId', unique: false },
        { name: 'contentType', keyPath: 'contentType', unique: false },
        { name: 'uploadedAt', keyPath: 'uploadedAt', unique: false },
        { name: 'status', keyPath: 'status', unique: false },
        { name: 'contentHash', keyPath: 'contentHash', unique: false },
        { name: 'expiresAt', keyPath: 'expiresAt', unique: false }
      ]
    },
    analytics_cache: {
      keyPath: 'id',
      // Stores cached analytics with TTL
      // { id: 'summary', data: {...}, cachedAt: Date, ttl: 300000 }
    }
  }
};
```

## Error Handling

### Tracking Errors

**Error Scenarios**:
1. IndexedDB unavailable → Fall back to localStorage (limited)
2. Metadata extraction fails → Store basic metadata only
3. Verification fails → Mark as failed, allow retry
4. Walrus response parsing fails → Log error, store minimal data

**Error Recovery**:
```typescript
class TrackingErrorHandler {
  async handleTrackingError(error: Error, blob: Partial<BlobMetadata>) {
    console.error('Tracking error:', error);
    
    // Try to store minimal metadata
    try {
      await this.storeMinimalMetadata(blob);
    } catch (fallbackError) {
      // Last resort: localStorage
      this.storeInLocalStorage(blob);
    }
  }
  
  private async storeMinimalMetadata(blob: Partial<BlobMetadata>) {
    // Store only essential fields
    const minimal = {
      blobId: blob.blobId,
      fileName: blob.fileName,
      uploadedAt: blob.uploadedAt || new Date(),
      status: 'active'
    };
    
    localStorage.setItem(`blob_${blob.blobId}`, JSON.stringify(minimal));
  }
}
```

## Testing Strategy

### Unit Tests

**Test Coverage**:
- BlobTrackingService CRUD operations
- Content type processors (image, video metadata extraction)
- Analytics calculations
- Duplicate detection
- Verification logic

**Example Test**:
```typescript
describe('BlobTrackingService', () => {
  it('should track blob metadata', async () => {
    const service = new BlobTrackingService();
    const metadata: BlobMetadata = { /* ... */ };
    
    await service.trackBlob(metadata);
    const retrieved = await service.getBlobMetadata(metadata.blobId);
    
    expect(retrieved).toEqual(metadata);
  });
  
  it('should find duplicates by content hash', async () => {
    const service = new BlobTrackingService();
    const hash = 'abc123';
    
    await service.trackBlob({ contentHash: hash, /* ... */ });
    await service.trackBlob({ contentHash: hash, /* ... */ });
    
    const duplicates = await service.findDuplicates(hash);
    expect(duplicates).toHaveLength(2);
  });
});
```

### Integration Tests

**Test Scenarios**:
1. Upload file → Verify metadata tracked
2. Download file → Verify download count incremented
3. Verify blob → Check aggregator accessibility
4. Generate analytics → Verify calculations
5. Export report → Verify format and content

## Performance Considerations

### Optimization Strategies

1. **IndexedDB Indexing**: Create indexes on frequently queried fields
2. **Analytics Caching**: Cache analytics results with 5-minute TTL
3. **Lazy Loading**: Load blob metadata on-demand, not all at once
4. **Batch Operations**: Process multiple blobs in batches for verification
5. **Web Workers**: Use workers for heavy computations (hash calculation, metadata extraction)

### Performance Targets

- Metadata storage: < 50ms
- Analytics generation: < 500ms for 1000 blobs
- Blob verification: < 2s per blob
- Search/filter: < 100ms for 1000 blobs

## Security Considerations

### Data Privacy

- Content hashes stored locally only (not on-chain)
- EXIF location data optional, user-controlled
- Verification uses HEAD requests (no full download)
- Analytics data stays local (IndexedDB)

### Access Control

- Only owner can view blob metadata
- Verification doesn't expose blob content
- Export requires user action (no automatic sharing)

## Deployment Strategy

### Rollout Plan

**Phase 1**: Core tracking (Requirements 1, 2, 5)
- Implement BlobTrackingService
- Add metadata storage on upload
- Display Walrus links in UI

**Phase 2**: Analytics (Requirements 3, 6)
- Implement analytics service
- Create analytics dashboard
- Add cost tracking

**Phase 3**: Advanced features (Requirements 7-15)
- Blob verification
- Duplicate detection
- Content-specific features
- Optimization recommendations

### Migration Strategy

**Existing Data**:
- Scan localStorage for existing blob metadata
- Migrate to IndexedDB with enhanced schema
- Backfill missing metadata where possible
- Mark legacy data for gradual enhancement

## Conclusion

This design provides a comprehensive solution for enhanced Walrus tracking in WalrusBox. The architecture is modular, performant, and integrates seamlessly with existing functionality while adding powerful new capabilities for managing decentralized storage.

Key benefits:
- **Complete Visibility**: Track every aspect of Walrus storage
- **Cost Management**: Understand and optimize storage costs
- **Content-Aware**: Specialized features for different file types
- **Proactive Management**: Verification, duplicate detection, optimization
- **User-Friendly**: Intuitive analytics and actionable insights
