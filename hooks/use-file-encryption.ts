"use client"

import { useState, useCallback } from "react"
import { encryptFile, decryptFile } from "@/lib/crypto-utils"

export interface FileEncryptionState {
  isProcessing: boolean
  error: string | null
  progress: number
}

export interface EncryptionResult {
  encryptedData: Blob
  filename: string
}

export interface DecryptionResult {
  decryptedData: Blob
  filename: string
  mimeType: string
}

export function useFileEncryption() {
  const [state, setState] = useState<FileEncryptionState>({
    isProcessing: false,
    error: null,
    progress: 0,
  })

  const updateProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress }))
  }, [])

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isProcessing: false, progress: 0 }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const encrypt = useCallback(
    async (file: File, password: string): Promise<EncryptionResult | null> => {
      if (!file || !password) {
        setError("File and password are required")
        return null
      }

      // File size limit: 1GB
      const MAX_FILE_SIZE = 1024 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 1GB limit")
        return null
      }

      // Password strength check
      if (password.length < 8) {
        setError("Password must be at least 8 characters long")
        return null
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null, progress: 0 }))

      try {
        updateProgress(10)

        const encryptedData = await encryptFile(file, password, updateProgress)

        updateProgress(100)

        const encryptedFilename = `${file.name}.ag`

        setState((prev) => ({ ...prev, isProcessing: false, progress: 0 }))

        return {
          encryptedData,
          filename: encryptedFilename,
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Encryption failed")
        return null
      }
    },
    [setError, updateProgress],
  )

  const decrypt = useCallback(
    async (file: File, password: string): Promise<DecryptionResult | null> => {
      if (!file || !password) {
        setError("File and password are required")
        return null
      }

      // Check if file appears to be encrypted (has .ag extension)
      if (!file.name.endsWith(".ag")) {
        setError("Selected file does not appear to be encrypted")
        return null
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null, progress: 0 }))

      try {
        updateProgress(10)

        const result = await decryptFile(file, password, updateProgress)

        updateProgress(100)

        setState((prev) => ({ ...prev, isProcessing: false, progress: 0 }))

        return result
      } catch (error) {
        if (error instanceof Error) {
          // More specific error categorization
          const errorMessage = error.message.toLowerCase()
          
          if (errorMessage.includes("invalid password") || 
              errorMessage.includes("wrong password") || 
              errorMessage.includes("authentication failed") ||
              errorMessage.includes("decryption failed")) {
            setError("Invalid password - The password you entered is incorrect")
          } else if (errorMessage.includes("corrupted") || 
                     errorMessage.includes("invalid file format") ||
                     errorMessage.includes("malformed")) {
            setError("Corrupted file - The encrypted file appears to be damaged")
          } else if (errorMessage.includes("not encrypted") || 
                     errorMessage.includes("invalid header")) {
            setError("Invalid file format - This file doesn't appear to be properly encrypted")
          } else if (errorMessage.includes("network") || 
                     errorMessage.includes("timeout")) {
            setError("Network error - Please check your connection and try again")
          } else {
            setError(error.message)
          }
        } else {
          setError("Decryption failed - An unknown error occurred")
        }
        return null
      }
    },
    [setError, updateProgress],
  )

  return {
    state,
    encrypt,
    decrypt,
    clearError,
  }
}
