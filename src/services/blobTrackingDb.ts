// IndexedDB Database for Blob Tracking
// Provides persistent storage for Walrus blob metadata

import type { BlobMetadata } from '@/types/walrus';

const DB_NAME = 'walrusbox_tracking';
const DB_VERSION = 1;
const BLOB_STORE = 'blobs';
const ANALYTICS_CACHE_STORE = 'analytics_cache';

/**
 * IndexedDB wrapper for blob tracking
 */
export class BlobTrackingDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Blob tracking database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create blobs store
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          const blobStore = db.createObjectStore(BLOB_STORE, { keyPath: 'blobId' });
          
          // Create indexes for efficient querying
          blobStore.createIndex('fileId', 'fileId', { unique: false });
          blobStore.createIndex('contentType', 'contentType', { unique: false });
          blobStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          blobStore.createIndex('status', 'status', { unique: false });
          blobStore.createIndex('contentHash', 'contentHash', { unique: false });

          blobStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          
          console.log('✅ Created blobs object store with indexes');
        }
        
        // Create analytics cache store
        if (!db.objectStoreNames.contains(ANALYTICS_CACHE_STORE)) {
          db.createObjectStore(ANALYTICS_CACHE_STORE, { keyPath: 'id' });
          console.log('✅ Created analytics cache object store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store blob metadata
   */
  async put(metadata: BlobMetadata): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOB_STORE], 'readwrite');
      const store = transaction.objectStore(BLOB_STORE);
      
      // Convert Date objects to ISO strings for storage
      const storageData = this.serializeMetadata(metadata);
      const request = store.put(storageData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get blob metadata by ID
   */
  async get(blobId: string): Promise<BlobMetadata | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOB_STORE], 'readonly');
      const store = transaction.objectStore(BLOB_STORE);
      const request = store.get(blobId);

      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? this.deserializeMetadata(data) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all blob metadata
   */
  async getAll(): Promise<BlobMetadata[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOB_STORE], 'readonly');
      const store = transaction.objectStore(BLOB_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const data = request.result || [];
        resolve(data.map(item => this.deserializeMetadata(item)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get blobs by index
   */
  async getByIndex(indexName: string, value: any): Promise<BlobMetadata[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOB_STORE], 'readonly');
      const store = transaction.objectStore(BLOB_STORE);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        const data = request.result || [];
        resolve(data.map(item => this.deserializeMetadata(item)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update blob metadata (partial update)
   */
  async update(blobId: string, updates: Partial<BlobMetadata>): Promise<void> {
    const existing = await this.get(blobId);
    if (!existing) {
      throw new Error(`Blob ${blobId} not found`);
    }

    const updated = { ...existing, ...updates };
    await this.put(updated);
  }

  /**
   * Delete blob metadata
   */
  async delete(blobId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BLOB_STORE], 'readwrite');
      const store = transaction.objectStore(BLOB_STORE);
      const request = store.delete(blobId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get analytics cache
   */
  async getAnalyticsCache(id: string): Promise<any | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ANALYTICS_CACHE_STORE], 'readonly');
      const store = transaction.objectStore(ANALYTICS_CACHE_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        
        // Check TTL
        if (data && data.cachedAt && data.ttl) {
          const age = Date.now() - new Date(data.cachedAt).getTime();
          if (age > data.ttl) {
            // Cache expired
            resolve(null);
            return;
          }
        }
        
        resolve(data ? data.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set analytics cache
   */
  async setAnalyticsCache(id: string, data: any, ttl: number = 300000): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ANALYTICS_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(ANALYTICS_CACHE_STORE);
      const request = store.put({
        id,
        data,
        cachedAt: new Date().toISOString(),
        ttl
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear analytics cache
   */
  async clearAnalyticsCache(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ANALYTICS_CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(ANALYTICS_CACHE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Serialize metadata for storage (convert Dates to strings)
   */
  private serializeMetadata(metadata: BlobMetadata): any {
    return {
      ...metadata,
      uploadedAt: metadata.uploadedAt.toISOString(),
      expiresAt: metadata.expiresAt.toISOString(),
      lastVerified: metadata.lastVerified?.toISOString(),
      lastAccessed: metadata.lastAccessed?.toISOString(),
      imageMetadata: metadata.imageMetadata ? {
        ...metadata.imageMetadata,
        exif: metadata.imageMetadata.exif ? {
          ...metadata.imageMetadata.exif,
          dateTaken: metadata.imageMetadata.exif.dateTaken?.toISOString()
        } : undefined
      } : undefined
    };
  }

  /**
   * Deserialize metadata from storage (convert strings to Dates)
   */
  private deserializeMetadata(data: any): BlobMetadata {
    return {
      ...data,
      uploadedAt: new Date(data.uploadedAt),
      expiresAt: new Date(data.expiresAt),
      lastVerified: data.lastVerified ? new Date(data.lastVerified) : undefined,
      lastAccessed: data.lastAccessed ? new Date(data.lastAccessed) : undefined,
      imageMetadata: data.imageMetadata ? {
        ...data.imageMetadata,
        exif: data.imageMetadata.exif ? {
          ...data.imageMetadata.exif,
          dateTaken: data.imageMetadata.exif.dateTaken ? new Date(data.imageMetadata.exif.dateTaken) : undefined
        } : undefined
      } : undefined
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
export const blobTrackingDb = new BlobTrackingDatabase();
