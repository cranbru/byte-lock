import { FileText, Image, FileVideo, FileAudio, Archive, Code, FileSpreadsheet, File } from "lucide-react"

export function getFileTypeIcon(filename: string, className?: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extension)) {
    return <Image className={className} />
  }
  
  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'].includes(extension)) {
    return <FileVideo className={className} />
  }
  
  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(extension)) {
    return <FileAudio className={className} />
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) {
    return <Archive className={className} />
  }
  
  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension)) {
    return <Code className={className} />
  }
  
  // Document files
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
    return <FileText className={className} />
  }
  
  // Spreadsheet files
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return <FileSpreadsheet className={className} />
  }
  
  // Default file icon
  return <File className={className} />
}

export function getFileTypeColor(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  // Image files - blue
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extension)) {
    return 'text-blue-400'
  }
  
  // Video files - purple
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'].includes(extension)) {
    return 'text-purple-400'
  }
  
  // Audio files - pink
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(extension)) {
    return 'text-pink-400'
  }
  
  // Archive files - yellow
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) {
    return 'text-yellow-400'
  }
  
  // Code files - green
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(extension)) {
    return 'text-green-400'
  }
  
  // Document files - red
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
    return 'text-red-400'
  }
  
  // Spreadsheet files - emerald
  if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return 'text-emerald-400'
  }
  
  // Default - gray
  return 'text-gray-400'
}