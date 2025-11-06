"use client"

import type React from "react"
import { useState, useCallback } from "react"

export interface MultipleFileHandlerState {
  selectedFiles: File[]
  isDragOver: boolean
  error: string | null
}

export function useMultipleFileHandler() {
  const [state, setState] = useState<MultipleFileHandlerState>({
    selectedFiles: [],
    isDragOver: false,
    error: null,
  })

  const validateFile = useCallback((file: File): string | null => {
    // File size limit: 1GB
    const MAX_FILE_SIZE = 1024 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(1)
      return `File "${file.name}" (${fileSizeGB}GB) exceeds the 1GB limit`
    }

    // Check for empty files
    if (file.size === 0) {
      return `File "${file.name}" is empty and cannot be encrypted`
    }



    return null
  }, [])

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const validFiles: File[] = []
      const errors: string[] = []

      fileArray.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          errors.push(error)
        } else {
          validFiles.push(file)
        }
      })

      if (validFiles.length === 0 && errors.length > 0) {
        setState((prev) => ({ 
          ...prev, 
          error: errors.join("; "), 
          selectedFiles: prev.selectedFiles 
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        selectedFiles: [...prev.selectedFiles, ...validFiles],
        error: errors.length > 0 ? errors.join("; ") : null,
      }))
      return true
    },
    [validateFile],
  )

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        addFiles(files)
      }
    },
    [addFiles],
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

      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        addFiles(files)
      }
    },
    [addFiles],
  )

  const removeFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index),
    }))
  }, [])

  const clearFiles = useCallback(() => {
    setState((prev) => ({ ...prev, selectedFiles: [], error: null }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newFiles = [...prev.selectedFiles]
      const [movedFile] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, movedFile)
      return { ...prev, selectedFiles: newFiles }
    })
  }, [])

  const removeAllFiles = useCallback(() => {
    setState((prev) => ({ ...prev, selectedFiles: [], error: null }))
  }, [])

  return {
    state,
    addFiles,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
    clearError,
    reorderFiles,
    removeAllFiles,
  }
}