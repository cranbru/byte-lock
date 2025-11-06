"use client"

import type React from "react"

import { useState, useCallback } from "react"

export interface FileHandlerState {
  selectedFile: File | null
  isDragOver: boolean
  error: string | null
}

export function useFileHandler() {
  const [state, setState] = useState<FileHandlerState>({
    selectedFile: null,
    isDragOver: false,
    error: null,
  })

  const validateFile = useCallback((file: File): string | null => {
    // File size limit: 1GB
    const MAX_FILE_SIZE = 1024 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 1GB limit"
    }

    // Check for empty files
    if (file.size === 0) {
      return "Cannot process empty files"
    }

    return null
  }, [])

  const selectFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        setState((prev) => ({ ...prev, error, selectedFile: null }))
        return false
      }

      setState((prev) => ({ ...prev, selectedFile: file, error: null }))
      return true
    },
    [validateFile],
  )

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        selectFile(file)
      }
    },
    [selectFile],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setState((prev) => ({ ...prev, isDragOver: true }))
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setState((prev) => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setState((prev) => ({ ...prev, isDragOver: false }))

      const file = event.dataTransfer.files[0]
      if (file) {
        selectFile(file)
      }
    },
    [selectFile],
  )

  const clearFile = useCallback(() => {
    setState((prev) => ({ ...prev, selectedFile: null, error: null }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    state,
    selectFile,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFile,
    clearError,
  }
}
