// Utility functions for file operations

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export function removeFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "")
}

export function isEncryptedFile(filename: string): boolean {
  return filename.endsWith(".ag")
}

export function getOriginalFilename(encryptedFilename: string): string {
  if (isEncryptedFile(encryptedFilename)) {
    return encryptedFilename.replace(".ag", "")
  }
  return encryptedFilename
}

export function validateFileName(filename: string): string | null {
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(filename)) {
    return "Filename contains invalid characters"
  }

  // Check length
  if (filename.length > 255) {
    return "Filename is too long (max 255 characters)"
  }

  if (filename.trim().length === 0) {
    return "Filename cannot be empty"
  }

  return null
}

export function sanitizeFileName(filename: string): string {
  // Remove invalid characters and trim
  return filename.replace(/[<>:"/\\|?*]/g, "_").trim()
}
