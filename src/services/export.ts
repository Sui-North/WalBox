import { FileMetadata } from './files';

/**
 * Export Service - Export file lists to various formats
 */

export const exportService = {
  /**
   * Export files to CSV
   */
  exportToCSV: (files: FileMetadata[], filename: string = 'walrusbox-files.csv'): void => {
    try {
      // CSV headers
      const headers = [
        'File Name',
        'File ID',
        'Size (bytes)',
        'Owner',
        'Visibility',
        'Uploaded At',
        'Allowed Wallets'
      ];

      // Convert files to CSV rows
      const rows = files.map(file => [
        file.file_id,
        file.id,
        file.walrus_object_hash.length.toString(),
        file.owner,
        file.visibility,
        file.uploadedAt.toISOString(),
        file.allowedWallets.join(';')
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export files to CSV');
    }
  },

  /**
   * Export files to JSON
   */
  exportToJSON: (files: FileMetadata[], filename: string = 'walrusbox-files.json'): void => {
    try {
      const jsonContent = JSON.stringify(files, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export files to JSON');
    }
  },

  /**
   * Copy file list to clipboard as text
   */
  copyToClipboard: async (files: FileMetadata[]): Promise<void> => {
    try {
      const text = files.map(file => 
        `${file.file_id} - ${file.visibility} - ${file.uploadedAt.toLocaleDateString()}`
      ).join('\n');
      
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  },
};
