// Client-side Encryption Service using Web Crypto API
// Keys are never stored on backend, all encryption happens in the browser

/**
 * Encrypts a file using Web Crypto API (AES-GCM)
 * All encryption/decryption happens client-side
 */
export const encryptionService = {
  /**
   * Encrypt a file client-side using AES-GCM
   * @param file - File to encrypt
   * @returns Encrypted blob
   */
  encrypt: async (file: File): Promise<Blob> => {
    try {
      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Generate a random 256-bit key
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      // Generate a random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the file data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        fileBuffer
      );
      
      // Export the key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      
      // Store the encryption key and metadata in session storage (client-side only)
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(keyId, JSON.stringify({
        key: Array.from(new Uint8Array(exportedKey)),
        iv: Array.from(iv),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      }));
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      // Return encrypted blob
      return new Blob([combined], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  },

  /**
   * Decrypt a file using stored encryption key
   * @param blob - Encrypted blob (contains IV + encrypted data)
   * @param keyId - Key identifier stored in session storage
   * @returns Decrypted blob
   */
  decrypt: async (blob: Blob, keyId: string): Promise<Blob> => {
    try {
      // Retrieve encryption key from session storage
      const keyData = sessionStorage.getItem(keyId);
      if (!keyData) {
        throw new Error('Encryption key not found');
      }
      
      const { key: keyArray, iv: ivArray, fileType } = JSON.parse(keyData);
      
      // Import the key
      const key = await crypto.subtle.importKey(
        'raw',
        new Uint8Array(keyArray),
        {
          name: 'AES-GCM',
          length: 256,
        },
        false, // not extractable
        ['decrypt']
      );
      
      // Read encrypted blob as ArrayBuffer
      const encryptedBuffer = await blob.arrayBuffer();
      const encryptedArray = new Uint8Array(encryptedBuffer);
      
      // Extract IV (first 12 bytes) and encrypted data (rest)
      const iv = encryptedArray.slice(0, 12);
      const encryptedData = encryptedArray.slice(12);
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encryptedData
      );
      
      // Return decrypted blob with original file type
      return new Blob([decryptedData], { type: fileType || 'application/octet-stream' });
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  },

  /**
   * Generate a new encryption key ID (for new files)
   * @returns Key identifier that can be stored with file metadata
   */
  generateKeyId: (): string => {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Store encryption key metadata (client-side only)
   * @param keyId - Key identifier
   * @param metadata - File metadata to associate with key
   */
  storeKeyMetadata: (keyId: string, metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }): void => {
    const existing = sessionStorage.getItem(keyId);
    if (existing) {
      const data = JSON.parse(existing);
      sessionStorage.setItem(keyId, JSON.stringify({ ...data, ...metadata }));
    }
  },

  /**
   * Remove encryption key from storage (cleanup)
   * @param keyId - Key identifier to remove
   */
  removeKey: (keyId: string): void => {
    sessionStorage.removeItem(keyId);
  }
};
