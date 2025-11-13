/**
 * File Preview Service - Generate previews for different file types
 */

export const previewService = {
  /**
   * Check if file can be previewed
   */
  canPreview: (fileName: string, fileType?: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeType = fileType?.toLowerCase() || '';

    // Images
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return true;
    }

    // PDFs
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return true;
    }

    // Text files
    if (
      mimeType.startsWith('text/') ||
      ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension)
    ) {
      return true;
    }

    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs'].includes(extension)) {
      return true;
    }

    return false;
  },

  /**
   * Get preview type
   */
  getPreviewType: (fileName: string, fileType?: string): 'image' | 'pdf' | 'text' | 'code' | 'none' => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeType = fileType?.toLowerCase() || '';

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return 'image';
    }

    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }

    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs'].includes(extension)) {
      return 'code';
    }

    if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension)) {
      return 'text';
    }

    return 'none';
  },

  /**
   * Generate image preview URL from blob
   */
  generateImagePreview: (blob: Blob): string => {
    return URL.createObjectURL(blob);
  },

  /**
   * Generate PDF preview URL from blob
   */
  generatePDFPreview: (blob: Blob): string => {
    return URL.createObjectURL(blob);
  },

  /**
   * Read text content from blob
   */
  readTextContent: async (blob: Blob): Promise<string> => {
    try {
      const text = await blob.text();
      return text;
    } catch (error) {
      console.error('Error reading text content:', error);
      throw new Error('Failed to read text content');
    }
  },

  /**
   * Get syntax highlighting language
   */
  getSyntaxLanguage: (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      h: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      json: 'json',
      xml: 'xml',
      html: 'html',
      css: 'css',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
    };

    return languageMap[extension] || 'plaintext';
  },

  /**
   * Revoke preview URL to free memory
   */
  revokePreviewURL: (url: string): void => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking preview URL:', error);
    }
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },
};
