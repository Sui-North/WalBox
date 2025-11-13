import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  FileArchive, 
  Code, 
  File,
  FileSpreadsheet,
  Presentation,
  FileType
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  fileType?: string;
  className?: string;
}

/**
 * Get file icon based on file type
 */
export const FileIcon = ({ fileName, fileType, className = "h-5 w-5" }: FileIconProps) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = fileType?.toLowerCase() || '';

  // Image files
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension)) {
    return <Image className={`${className} text-purple-500`} />;
  }

  // Video files
  if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension)) {
    return <Video className={`${className} text-red-500`} />;
  }

  // Audio files
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
    return <Music className={`${className} text-pink-500`} />;
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) {
    return <FileArchive className={`${className} text-orange-500`} />;
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension)) {
    return <Code className={`${className} text-green-500`} />;
  }

  // Document files
  if (['pdf'].includes(extension) || mimeType === 'application/pdf') {
    return <FileText className={`${className} text-red-600`} />;
  }

  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
    return <FileText className={`${className} text-blue-500`} />;
  }

  // Spreadsheet files
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return <FileSpreadsheet className={`${className} text-green-600`} />;
  }

  // Presentation files
  if (['ppt', 'pptx', 'odp'].includes(extension)) {
    return <Presentation className={`${className} text-orange-600`} />;
  }

  // Default file icon
  return <File className={`${className} text-gray-500`} />;
};

/**
 * Get file type category
 */
export const getFileCategory = (fileName: string, fileType?: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = fileType?.toLowerCase() || '';

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
    return 'audio';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'archive';
  }
  if (['js', 'ts', 'py', 'java', 'cpp', 'php'].includes(extension)) {
    return 'code';
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
    return 'document';
  }
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return 'spreadsheet';
  }
  if (['ppt', 'pptx'].includes(extension)) {
    return 'presentation';
  }
  return 'other';
};
