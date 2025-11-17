import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileMetadata } from '@/services/files';
import { localFilesService, LocalFileMetadata } from '@/services/localFiles';
import { storageService } from '@/services/storage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Share2, Trash2, Lock, Unlock, FolderOpen } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { toast } from '@/hooks/use-toast';

interface VirtualFileListProps {
  files: FileMetadata[];
  onRefresh: () => void;
}

const ITEM_HEIGHT = 73; // Height of each table row in pixels
const OVERSCAN = 5; // Number of items to render outside viewport

export const VirtualFileList = ({ files, onRefresh }: VirtualFileListProps) => {
  const navigate = useNavigate();
  const [shareModalFile, setShareModalFile] = useState<LocalFileMetadata | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
    const end = Math.min(files.length, start + visibleCount + OVERSCAN * 2);
    const offset = start * ITEM_HEIGHT;
    
    return { startIndex: start, endIndex: end, offsetY: offset };
  }, [scrollTop, containerHeight, files.length]);

  const visibleFiles = useMemo(() => {
    return files.slice(startIndex, endIndex);
  }, [files, startIndex, endIndex]);

  const totalHeight = files.length * ITEM_HEIGHT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    container.addEventListener('scroll', handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const handleDelete = async (file: FileMetadata) => {
    try {
      await storageService.deleteBlob(file.id);
      localFilesService.deleteFile(file.id);
      onRefresh();
      toast({
        title: "File Deleted",
        description: "File has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete file",
        variant: "destructive",
      });
    }
  };

  const handleShare = (file: FileMetadata) => {
    const localFile = localFilesService.getFile(file.id);
    if (localFile) {
      setShareModalFile(localFile);
    } else {
      const newLocalFile: LocalFileMetadata = {
        id: file.id,
        name: file.file_id || 'Unknown',
        size: 0,
        type: 'application/octet-stream',
        uploadedAt: file.uploadedAt,
        visibility: file.visibility,
        allowedWallets: file.allowedWallets,
      };
      localFilesService.saveFile(newLocalFile);
      setShareModalFile(newLocalFile);
    }
  };

  if (files.length === 0) {
    return (
      <div className="glass-effect p-16 rounded-2xl text-center border border-white/5">
        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
          <FolderOpen className="h-12 w-12 text-primary" />
        </div>
        <p className="text-muted-foreground text-lg">No files uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-2">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl glass-effect border border-white/10 overflow-hidden shadow-elevated animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="font-semibold">Uploaded</TableHead>
              <TableHead className="font-semibold">Visibility</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        
        <div 
          ref={containerRef}
          className="overflow-auto"
          style={{ height: '600px', maxHeight: '70vh' }}
        >
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              <Table>
                <TableBody>
                  {visibleFiles.map((file, index) => {
                    const actualIndex = startIndex + index;
                    return (
                      <TableRow 
                        key={file.id} 
                        className="hover:bg-primary/5 transition-colors duration-200 border-white/5"
                        style={{ height: `${ITEM_HEIGHT}px` }}
                      >
                        <TableCell className="font-medium">{file.file_id || 'Unknown'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {localFilesService.getFile(file.id)?.size 
                            ? localFilesService.formatFileSize(localFilesService.getFile(file.id)!.size)
                            : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {file.uploadedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={file.visibility === 'public' ? 'default' : 'secondary'}
                            className="gap-1.5 font-medium"
                          >
                            {file.visibility === 'public' ? (
                              <Unlock className="h-3 w-3" />
                            ) : (
                              <Lock className="h-3 w-3" />
                            )}
                            {file.visibility}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/file/${file.id}`)}
                              className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShare(file)}
                              className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(file)}
                              className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {shareModalFile && (
        <ShareModal
          file={shareModalFile}
          onClose={() => setShareModalFile(null)}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
};
