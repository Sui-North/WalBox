import { useEffect, useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { previewService } from '@/services/preview';
import { storageService } from '@/services/storage';
import { encryptionService } from '@/services/encryption';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType?: string;
  walrusHash: Uint8Array;
  onDownload: () => void;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  fileType,
  walrusHash,
  onDownload,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewType = previewService.getPreviewType(fileName, fileType);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup preview URL when modal closes
      if (previewUrl) {
        previewService.revokePreviewURL(previewUrl);
        setPreviewUrl(null);
      }
      setTextContent(null);
      setError(null);
      return;
    }

    loadPreview();
  }, [isOpen, fileName]);

  const loadPreview = async () => {
    if (!previewService.canPreview(fileName, fileType)) {
      setError('Preview not available for this file type');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Download file from storage
      const encryptedBlob = await storageService.downloadFromWalrus(walrusHash);
      
      // Try to decrypt (will return as-is if encryption not available)
      const keyId = localStorage.getItem(`key_${fileName}`);
      let blob = encryptedBlob;
      
      if (keyId) {
        try {
          blob = await encryptionService.decrypt(encryptedBlob, keyId);
        } catch (decryptError) {
          console.warn('Decryption failed, using encrypted blob:', decryptError);
        }
      }

      // Generate preview based on type
      if (previewType === 'image') {
        const url = previewService.generateImagePreview(blob);
        setPreviewUrl(url);
      } else if (previewType === 'pdf') {
        const url = previewService.generatePDFPreview(blob);
        setPreviewUrl(url);
      } else if (previewType === 'text' || previewType === 'code') {
        const text = await previewService.readTextContent(blob);
        setTextContent(text);
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-effect border-primary/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold truncate pr-8">
              {fileName}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onDownload}
                className="hover:bg-primary/10"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 overflow-auto max-h-[calc(90vh-120px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={onDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Instead
              </Button>
            </div>
          )}

          {!isLoading && !error && previewType === 'image' && previewUrl && (
            <div className="flex items-center justify-center bg-black/5 rounded-lg p-4">
              <img
                src={previewUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          )}

          {!isLoading && !error && previewType === 'pdf' && previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] rounded-lg border border-primary/20"
              title={fileName}
            />
          )}

          {!isLoading && !error && (previewType === 'text' || previewType === 'code') && textContent && (
            <pre className="bg-black/5 p-4 rounded-lg overflow-auto text-sm font-mono max-h-[70vh]">
              <code>{textContent}</code>
            </pre>
          )}

          {!isLoading && !error && previewType === 'none' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={onDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
