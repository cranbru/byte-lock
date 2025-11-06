"use client"

import { useState, useCallback } from "react"
import { encryptFile, decryptFile } from "@/lib/crypto-utils"

export interface MultipleFileEncryptionState {
  isProcessing: boolean
  error: string | null
  progress: number
  currentFileIndex: number
  totalFiles: number
}

export interface EncryptedFileResult {
  encryptedData: Blob
  originalFilename: string
  encryptedFilename: string
}

export interface MultipleEncryptionResult {
  encryptedFiles: EncryptedFileResult[]
  folderName: string
}

export function useMultipleFileEncryption() {
  const [state, setState] = useState<MultipleFileEncryptionState>({
    isProcessing: false,
    error: null,
    progress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
  })

  const updateProgress = useCallback((fileIndex: number, totalFiles: number, fileProgress: number) => {
    const overallProgress = ((fileIndex * 100) + fileProgress) / totalFiles
    setState((prev) => ({ 
      ...prev, 
      progress: overallProgress,
      currentFileIndex: fileIndex,
      totalFiles: totalFiles
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setState((prev) => ({ 
      ...prev, 
      error, 
      isProcessing: false, 
      progress: 0,
      currentFileIndex: 0,
      totalFiles: 0
    }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const encryptMultiple = useCallback(
    async (files: File[], password: string, folderName: string): Promise<MultipleEncryptionResult | null> => {
      if (!files || files.length === 0 || !password) {
        setError("Files and password are required")
        return null
      }

      // Password strength check
      if (password.length < 8) {
        setError("Password must be at least 8 characters long")
        return null
      }

      setState((prev) => ({ 
        ...prev, 
        isProcessing: true, 
        error: null, 
        progress: 0,
        currentFileIndex: 0,
        totalFiles: files.length
      }))

      try {
        const encryptedFiles: EncryptedFileResult[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          
          // Update progress for current file
          updateProgress(i, files.length, 0)

          // Validate file size
          const MAX_FILE_SIZE = 1024 * 1024 * 1024
          if (file.size > MAX_FILE_SIZE) {
            continue
          }

          // Encrypt the file
          const encryptedData = await encryptFile(file, password, (progress) => {
            updateProgress(i, files.length, progress)
          })

          const encryptedFilename = `${file.name}.ag`

          encryptedFiles.push({
            encryptedData,
            originalFilename: file.name,
            encryptedFilename,
          })
        }

        if (encryptedFiles.length === 0) {
          setError("No files were successfully encrypted")
          return null
        }

        setState((prev) => ({ 
          ...prev, 
          isProcessing: false, 
          progress: 100,
          currentFileIndex: files.length,
          totalFiles: files.length
        }))

        return {
          encryptedFiles,
          folderName: folderName || "encrypted_files",
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Multiple file encryption failed")
        return null
      }
    },
    [setError, updateProgress],
  )

  return {
    state,
    encryptMultiple,
    clearError,
  }
}