// Walrus Storage Service - Decentralized object storage for encrypted files
// Uses fetch API to interact with Walrus storage endpoint

// Walrus API endpoint configuration
const WALRUS_ENDPOINT = import.meta.env.VITE_WALRUS_ENDPOINT || 'https://walrus-api.example.com';

/**
 * Upload encrypted file blob to Walrus and return object hash (CID-like reference)
 * @param blob - Encrypted file blob
 * @param fileName - Original file name
 * @returns Walrus object hash (vector<u8> format for Sui contract)
 */
export class StorageService {
  /**
   * Upload encrypted blob to Walrus
   * @param blob - Encrypted file blob
   * @param fileName - Original file name (for metadata)
   * @returns Object hash as Uint8Array (for Sui contract)
   */
  async uploadToWalrus(blob: Blob, fileName: string): Promise<Uint8Array> {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('metadata', JSON.stringify({
        fileName,
        contentType: blob.type,
        uploadedAt: new Date().toISOString(),
      }));

      // Upload to Walrus API
      const response = await fetch(`${WALRUS_ENDPOINT}/upload`, {
        method: 'POST',
        body: formData,
        // Note: In production, you may need to add authentication headers
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        // },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Walrus returns a hash (CID-like reference)
      // Convert hash string to Uint8Array for Sui contract
      const hashBytes = this.hashToBytes(result.hash || result.cid || result.objectHash);
      
      return hashBytes;
    } catch (error) {
      console.error('Walrus upload error:', error);
      throw new Error('Failed to upload file to Walrus storage');
    }
  }

  /**
   * Download file from Walrus using object hash
   * @param objectHash - Walrus object hash (from Sui contract)
   * @returns File blob
   */
  async downloadFromWalrus(objectHash: Uint8Array): Promise<Blob> {
    try {
      // Convert Uint8Array back to hash string
      const hashString = this.bytesToHash(objectHash);
      
      // Download from Walrus API
      const response = await fetch(`${WALRUS_ENDPOINT}/download/${hashString}`, {
        method: 'GET',
        // Note: In production, you may need to add authentication headers
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        // },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Return as blob
      return await response.blob();
    } catch (error) {
      console.error('Walrus download error:', error);
      throw new Error('Failed to download file from Walrus storage');
    }
  }

  /**
   * Delete file from Walrus (if supported)
   * @param objectHash - Walrus object hash
   */
  async deleteFromWalrus(objectHash: Uint8Array): Promise<void> {
    try {
      const hashString = this.bytesToHash(objectHash);
      
      const response = await fetch(`${WALRUS_ENDPOINT}/delete/${hashString}`, {
        method: 'DELETE',
        // Note: In production, you may need to add authentication headers
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        // },
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Walrus delete error:', error);
      throw new Error('Failed to delete file from Walrus storage');
    }
  }

  /**
   * Convert hash string to Uint8Array for Sui contract
   * @param hash - Hash string (hex or base58)
   * @returns Uint8Array
   */
  private hashToBytes(hash: string): Uint8Array {
    // If hash is hex string, convert to bytes
    if (hash.startsWith('0x')) {
      hash = hash.slice(2);
    }
    
    // Try hex decoding first
    if (/^[0-9a-fA-F]+$/.test(hash) && hash.length % 2 === 0) {
      const bytes = new Uint8Array(hash.length / 2);
      for (let i = 0; i < hash.length; i += 2) {
        bytes[i / 2] = parseInt(hash.substr(i, 2), 16);
      }
      return bytes;
    }
    
    // Otherwise, convert string to UTF-8 bytes
    return new TextEncoder().encode(hash);
  }

  /**
   * Convert Uint8Array back to hash string
   * @param bytes - Hash bytes
   * @returns Hash string
   */
  private bytesToHash(bytes: Uint8Array): string {
    // Convert bytes to hex string
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Legacy IndexedDB methods for backward compatibility during migration
   * These can be removed once fully migrated to Walrus
   */
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'web3_file_storage';
  private readonly STORE_NAME = 'files';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async storeBlob(id: string, blob: Blob): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put({ id, blob });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getBlob(id: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBlob(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageService = new StorageService();
