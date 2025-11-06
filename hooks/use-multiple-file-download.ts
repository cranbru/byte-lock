"use client"

import { useCallback } from "react"
import JSZip from "jszip"

export interface FileDownloadItem {
  blob: Blob
  filename: string
}

export function useMultipleFileDownload() {
  const downloadMultipleFilesAsFolder = useCallback(async (
    files: FileDownloadItem[], 
    folderName: string
  ) => {
    try {
      if (!files || files.length === 0) {
        throw new Error("No files provided for download")
      }

      if (!folderName || typeof folderName !== "string" || folderName.trim() === "") {
        throw new Error("Invalid folder name provided")
      }

      const zip = new JSZip()

      files.forEach((file) => {
        if (!file.blob || !file.filename) {
          return
        }

        if (!(file.blob instanceof Blob)) {
          if (file.blob instanceof ArrayBuffer) {
            file.blob = new Blob([file.blob])
          } else if (file.blob instanceof Uint8Array) {
            file.blob = new Blob([file.blob])
          } else {
            return
          }
        }

        if (file.blob.size === 0) {
          return
        }

        zip.file(file.filename, file.blob)
      })

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6,
        },
      })

      // Create download link
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${folderName.trim()}.zip`
      link.style.display = "none"

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      throw new Error(
        `Failed to download folder: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }, [])

  return { downloadMultipleFilesAsFolder }
}