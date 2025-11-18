import { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Shield, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { previewService } from '@/services/preview';
import { storageService } from '@/services/storage';
import { encryptionService } from '@/services/encryption';
import { sealStorageService } from '@/services/seal/sealStorage';
import type { SealFileMetadata, DownloadProgress } from '@/services/seal/sealTypes';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType?: string;
  walrusHash: Uint8Array;
  onDownload: () => void;
  fileId?: string;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  fileType,
  walrusHash,
  onDownload,
  fileId,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [decryptionStage, setDecryptionStage] = useState<string>('');

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
      setDecryptionProgress(0);
      setDecryptionStage('');
      return;
    }

    loadPreview();
  }, [isOpen, fileName, fileId]);

  const loadPreview = async () => {
    if (!previewService.canPreview(fileName, fileType)) {
      setError('Preview not available for this file type');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDecryptionProgress(0);
    setDecryptionStage('');

    try {
      // Check if file is encrypted with Seal
      const sealKey = fileId ? localStorage.getItem(`seal_key_${fileId}`) : null;
      setIsEncrypted(!!sealKey);

      let blob: Blob;

      if (sealKey && fileId) {
        // File is encrypted with Seal - use Seal storage service
        setDecryptionStage('Downloading encrypted file...');
        
        // We need to construct metadata for download
        // In a real implementation, this should be stored and retrieved properly
        const metadata: Partial<SealFileMetadata> = {
          blobId: Array.from(walrusHash).map(b => b.toString(16).padStart(2, '0')).join(''),
          fileId: fileId,
          fileName: fileName,
          encryptedSize: 0, // Unknown at this point
          isEncrypted: true,
          isChunked: false,
          chunks: [],
          initializationVector: '',
          encryptionAlgorithm: 'AES-GCM',
        };

        try {
          blob = await sealStorageService.downloadFile(
            metadata as SealFileMetadata,
            {
              decrypt: true,
              encryptionKey: sealKey,
              onProgress: (progress: DownloadProgress) => {
                setDecryptionProgress(progress.percentage);
                if (progress.stage === 'downloading') {
                  setDecryptionStage(`Downloading chunk ${progress.currentChunk || 0}/${progress.totalChunks || 1}...`);
                } else if (progress.stage === 'decrypting') {
                  setDecryptionStage('Decrypting file...');
                } else if (progress.stage === 'reassembling') {
                  setDecryptionStage('Reassembling chunks...');
                }
              }
            }
          );
        } catch (decryptError) {
          console.error('Seal decryption failed:', decryptError);
          setError('Failed to decrypt file. The encryption key may be invalid or the file may be corrupted.');
          setIsLoading(false);
          return;
        }
      } else {
        // Try legacy encryption or unencrypted
        const encryptedBlob = await storageService.downloadFromWalrus(walrusHash);
        
        const keyId = localStorage.getItem(`key_${fileName}`);
        blob = encryptedBlob;
        
        if (keyId) {
          try {
            setDecryptionStage('Decrypting file...');
            blob = await encryptionService.decrypt(encryptedBlob, keyId);
          } catch (decryptError) {
            console.warn('Legacy decryption failed, using encrypted blob:', decryptError);
          }
        }
      }

      setDecryptionStage('Generating preview...');

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
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
      setDecryptionProgress(0);
      setDecryptionStage('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-effect border-primary/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold truncate">
                {fileName}
              </DialogTitle>
              {isEncrypted && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/30 bg-primary/10 shrink-0">
                  <Shield className="h-3 w-3 text-primary" />
                  Encrypted
                </Badge>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
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
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                {isEncrypted && (
                  <Shield className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              {decryptionStage && (
                <div className="w-full max-w-md space-y-2">
                  <p className="text-sm text-center text-muted-foreground">{decryptionStage}</p>
                  {decryptionProgress > 0 && (
                    <Progress value={decryptionProgress} className="h-2" />
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <X className="h-12 w-12 text-destructive" />
              </div>
              <p className="text-destructive mb-2 font-semibold">Preview Failed</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
              {isEncrypted && (
                <p className="text-xs text-muted-foreground mb-4 max-w-md">
                  This file is encrypted. Make sure you have the correct decryption key.
                </p>
              )}
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
