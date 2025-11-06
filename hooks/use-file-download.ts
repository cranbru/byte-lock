"use client"

import { useCallback } from "react"

export function useFileDownload() {
  const downloadFile = useCallback((blob: Blob, filename: string) => {
    try {
      if (!blob) {
        throw new Error("No file data provided")
      }

      if (!(blob instanceof Blob)) {
        // Try to convert if it's an ArrayBuffer or Uint8Array
        if (blob instanceof ArrayBuffer) {
          blob = new Blob([blob])
        } else if (blob instanceof Uint8Array) {
          blob = new Blob([blob])
        } else {
          throw new Error(`Invalid file data type: expected Blob, got ${typeof blob}`)
        }
      }

      if (blob.size === 0) {
        throw new Error("File data is empty")
      }

      if (!filename || typeof filename !== "string" || filename.trim() === "") {
        throw new Error("Invalid filename provided")
      }

      // Create object URL for the blob
      const url = URL.createObjectURL(blob)

      // Create temporary download link
      const link = document.createElement("a")
      link.href = url
      link.download = filename.trim()
      link.style.display = "none"

      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up object URL after a short delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [])

  return { downloadFile }
}
