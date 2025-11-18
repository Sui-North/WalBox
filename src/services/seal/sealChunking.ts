// Seal Chunking Service
// Handles file chunking and reassembly for distributed storage

import {
  ChunkingOptions,
  ChunkMetadata,
  SealError,
  SealErrorType
} from './sealTypes';
import { getSealConfig } from './sealConfig';

/**
 * Default chunk size (10MB)
 */
const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Maximum number of chunks per file
 */
const DEFAULT_MAX_CHUNKS = 1000;

/**
 * Seal Chunking Service
 * Provides file chunking and reassembly operations
 */
export class SealChunkingService {
  /**
   * Split a file into chunks for distributed storage
   * @param data - File data as Uint8Array
   * @param options - Chunking options
   * @returns Array of chunks as Uint8Array
   */
  async chunkFile(
    data: Uint8Array,
    options: ChunkingOptions = {}
  ): Promise<Uint8Array[]> {
    try {
      // Get chunk size from options or config
      const config = getSealConfig();
      const chunkSize = options.chunkSize || config.chunkSize || DEFAULT_CHUNK_SIZE;
      const maxChunks = options.maxChunks || DEFAULT_MAX_CHUNKS;

      // Validate input
      if (data.length === 0) {
        throw new SealError(
          SealErrorType.CHUNKING_ERROR,
          'Cannot chunk empty file',
          undefined,
          false,
          { dataSize: 0 }
        );
      }

      // Calculate number of chunks needed
      const chunkCount = this.calculateChunkCount(data.length, chunkSize);

      // Validate chunk count
      if (chunkCount > maxChunks) {
        throw new SealError(
          SealErrorType.CHUNKING_ERROR,
          `File requires ${chunkCount} chunks, which exceeds maximum of ${maxChunks}`,
          undefined,
          false,
          { chunkCount, maxChunks, fileSize: data.length, chunkSize }
        );
      }

      // Split data into chunks
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, data.length);
        const chunk = data.slice(i, end);
        chunks.push(chunk);
      }

      return chunks;
    } catch (error) {
      if (error instanceof SealError) {
        throw error;
      }
      
      throw new SealError(
        SealErrorType.CHUNKING_ERROR,
        `Failed to chunk file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        false,
        { dataSize: data.length }
      );
    }
  }

  /**
   * Reassemble chunks back into original file data
   * @param chunks - Array of chunks to reassemble
   * @returns Reassembled data as Uint8Array
   */
  async reassembleChunks(chunks: Uint8Array[]): Promise<Uint8Array> {
    try {
      // Validate input
      if (chunks.length === 0) {
        throw new SealError(
          SealErrorType.CHUNKING_ERROR,
          'Cannot reassemble empty chunk array',
          undefined,
          false
        );
      }

      // Calculate total size
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

      // Create buffer for reassembled data
      const reassembled = new Uint8Array(totalSize);

      // Copy chunks into buffer
      let offset = 0;
      for (const chunk of chunks) {
        reassembled.set(chunk, offset);
        offset += chunk.length;
      }

      return reassembled;
    } catch (error) {
      if (error instanceof SealError) {
        throw error;
      }
      
      throw new SealError(
        SealErrorType.CHUNKING_ERROR,
        `Failed to reassemble chunks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        false,
        { chunkCount: chunks.length }
      );
    }
  }

  /**
   * Calculate the number of chunks needed for a file
   * @param fileSize - Size of file in bytes
   * @param chunkSize - Size of each chunk in bytes
   * @returns Number of chunks needed
   */
  calculateChunkCount(fileSize: number, chunkSize: number): number {
    if (fileSize <= 0) {
      return 0;
    }
    if (chunkSize <= 0) {
      throw new SealError(
        SealErrorType.CHUNKING_ERROR,
        'Chunk size must be greater than 0',
        undefined,
        false,
        { chunkSize }
      );
    }
    return Math.ceil(fileSize / chunkSize);
  }

  /**
   * Generate SHA-256 hash for a chunk
   * @param chunk - Chunk data as Uint8Array
   * @returns Hash as hex string
   */
  async generateChunkHash(chunk: Uint8Array): Promise<string> {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', chunk as unknown as BufferSource);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      throw new SealError(
        SealErrorType.CHUNKING_ERROR,
        `Failed to generate chunk hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        false,
        { chunkSize: chunk.length }
      );
    }
  }

  /**
   * Verify chunk integrity using hash
   * @param chunk - Chunk data to verify
   * @param expectedHash - Expected hash value
   * @returns true if hash matches
   */
  async verifyChunkHash(chunk: Uint8Array, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.generateChunkHash(chunk);
      return actualHash === expectedHash;
    } catch (error) {
      throw new SealError(
        SealErrorType.VERIFICATION_ERROR,
        `Failed to verify chunk hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        false,
        { chunkSize: chunk.length, expectedHash }
      );
    }
  }

  /**
   * Generate metadata for chunks
   * @param chunks - Array of chunks
   * @param generateHashes - Whether to generate hashes for each chunk
   * @returns Array of ChunkMetadata objects
   */
  async generateChunkMetadata(
    chunks: Uint8Array[],
    generateHashes: boolean = true
  ): Promise<ChunkMetadata[]> {
    try {
      const metadata: ChunkMetadata[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const hash = generateHashes ? await this.generateChunkHash(chunk) : '';

        metadata.push({
          index: i,
          size: chunk.length,
          hash
        });
      }

      return metadata;
    } catch (error) {
      throw new SealError(
        SealErrorType.CHUNKING_ERROR,
        `Failed to generate chunk metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
        false,
        { chunkCount: chunks.length }
      );
    }
  }

  /**
   * Optimize chunk size based on file size
   * Returns an optimal chunk size that balances between:
   * - Too many small chunks (overhead)
   * - Too few large chunks (memory usage)
   * @param fileSize - Size of file in bytes
   * @param minChunkSize - Minimum chunk size (default: 1MB)
   * @param maxChunkSize - Maximum chunk size (default: 50MB)
   * @param targetChunkCount - Target number of chunks (default: 10)
   * @returns Optimized chunk size in bytes
   */
  optimizeChunkSize(
    fileSize: number,
    minChunkSize: number = 1024 * 1024, // 1MB
    maxChunkSize: number = 50 * 1024 * 1024, // 50MB
    targetChunkCount: number = 10
  ): number {
    // For small files, use minimum chunk size
    if (fileSize <= minChunkSize) {
      return minChunkSize;
    }

    // Calculate ideal chunk size based on target chunk count
    const idealChunkSize = Math.ceil(fileSize / targetChunkCount);

    // Clamp to min/max bounds
    const optimizedSize = Math.max(minChunkSize, Math.min(maxChunkSize, idealChunkSize));

    // Round to nearest MB for cleaner sizes
    const roundedSize = Math.ceil(optimizedSize / (1024 * 1024)) * (1024 * 1024);

    return roundedSize;
  }

  /**
   * Validate chunk ordering and completeness
   * @param metadata - Array of chunk metadata to validate
   * @returns true if chunks are properly ordered and complete
   */
  validateChunkOrdering(metadata: ChunkMetadata[]): boolean {
    if (metadata.length === 0) {
      return false;
    }

    // Check that indices are sequential starting from 0
    for (let i = 0; i < metadata.length; i++) {
      if (metadata[i].index !== i) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sort chunk metadata by index
   * @param metadata - Array of chunk metadata to sort
   * @returns Sorted array of chunk metadata
   */
  sortChunkMetadata(metadata: ChunkMetadata[]): ChunkMetadata[] {
    return [...metadata].sort((a, b) => a.index - b.index);
  }

  /**
   * Get total size from chunk metadata
   * @param metadata - Array of chunk metadata
   * @returns Total size in bytes
   */
  getTotalSizeFromMetadata(metadata: ChunkMetadata[]): number {
    return metadata.reduce((sum, chunk) => sum + chunk.size, 0);
  }
}

// Export singleton instance
export const sealChunkingService = new SealChunkingService();
