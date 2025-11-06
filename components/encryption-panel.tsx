"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Upload, AlertCircle, CheckCircle2, Eye, EyeOff, Folder, RotateCcw, Trash2, GripVertical } from "lucide-react"
import { useMultipleFileEncryption } from "@/hooks/use-multiple-file-encryption"
import { useMultipleFileHandler } from "@/hooks/use-multiple-file-handler"
import { useMultipleFileDownload } from "@/hooks/use-multiple-file-download"
import { usePasswordValidation } from "@/hooks/use-password-validation"
import { formatFileSize } from "@/lib/file-utils"
import { getFileTypeIcon, getFileTypeColor } from "@/lib/file-type-utils"

export function EncryptionPanel() {
  const [encryptedResult, setEncryptedResult] = useState<{ files: { blob: Blob; filename: string }[]; folderName: string; encryptionTime?: number } | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [folderName, setFolderName] = useState("encrypted_files")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [encryptionStartTime, setEncryptionStartTime] = useState<number | null>(null)

  const fileHandler = useMultipleFileHandler()
  const { state: encryptionState, encryptMultiple, clearError } = useMultipleFileEncryption()
  const { downloadMultipleFilesAsFolder } = useMultipleFileDownload()
  const passwordValidation = usePasswordValidation()

  const handleEncrypt = async () => {
    if (fileHandler.state.selectedFiles.length === 0 || !passwordValidation.validation.isValid) {
      return
    }

    // Validate files before encryption
    if (!validateFilesBeforeEncryption()) {
      return
    }

    clearError()
    setDownloadError(null)
    
    // Start timing
    const startTime = Date.now()
    setEncryptionStartTime(startTime)
    
    const result = await encryptMultiple(fileHandler.state.selectedFiles, passwordValidation.password, folderName)

    if (result && result.encryptedFiles.length > 0) {
      // Calculate encryption time
      const endTime = Date.now()
      const encryptionTime = endTime - startTime
      
      const files = result.encryptedFiles.map(file => ({
        blob: file.encryptedData,
        filename: file.encryptedFilename
      }))
      setEncryptedResult({ files, folderName: result.folderName, encryptionTime })
    }
    
    setEncryptionStartTime(null)
  }

  const handleDownload = async () => {
    if (!encryptedResult || encryptedResult.files.length === 0) {
      setDownloadError("No files available for download")
      return
    }

    try {
      setDownloadError(null)

      // Validate files before download
      const validFiles = encryptedResult.files.filter(file => {
        if (!file.blob || !(file.blob instanceof Blob) || file.blob.size === 0) {
          return false
        }
        return true
      })

      if (validFiles.length === 0) {
        throw new Error("No valid files available for download")
      }

      // If only one file, download directly without ZIP
      if (validFiles.length === 1) {
        const file = validFiles[0]
        const url = URL.createObjectURL(file.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Multiple files - create ZIP archive
        await downloadMultipleFilesAsFolder(validFiles, encryptedResult.folderName)
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed")
    }
  }

  const handleReset = () => {
    setEncryptedResult(null)
    setDownloadError(null)
    setEncryptionStartTime(null)
    fileHandler.clearFiles()
    passwordValidation.clearPassword()
    clearError()
  }

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      fileHandler.reorderFiles(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // File size validation before encryption
  const validateFilesBeforeEncryption = () => {
    const totalSize = fileHandler.state.selectedFiles.reduce((sum, file) => sum + file.size, 0)
    const totalSizeGB = totalSize / (1024 * 1024 * 1024)
    
    if (totalSizeGB > 5) { // 5GB total limit
      setDownloadError(`Total file size (${totalSizeGB.toFixed(1)}GB) exceeds 5GB limit. Please remove some files.`)
      return false
    }
    
    return true
  }

  // Format encryption time
  const formatEncryptionTime = (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(milliseconds / 60000)
      const seconds = ((milliseconds % 60000) / 1000).toFixed(1)
      return `${minutes}m ${seconds}s`
    }
  }

  const canEncrypt =
    fileHandler.state.selectedFiles.length > 0 && passwordValidation.validation.isValid && !encryptionState.isProcessing

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          fileHandler.state.isDragOver
            ? "border-green-400 bg-green-950/30"
            : "border-green-500/50 bg-black/20 hover:border-green-400"
        }`}
        onDragOver={fileHandler.handleDragOver}
        onDragLeave={fileHandler.handleDragLeave}
        onDrop={fileHandler.handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={fileHandler.handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="encrypt-file"
        />
        <label 
          htmlFor="encrypt-file" 
          className="block cursor-pointer p-8 text-center"
        >
          <Upload className="mx-auto h-12 w-12 text-green-400 mb-4" />
          <span className="text-green-300 font-mono">
            {fileHandler.state.isDragOver
              ? "> Drop files here to encrypt"
              : fileHandler.state.selectedFiles.length > 0 
              ? `> ${fileHandler.state.selectedFiles.length} file(s) selected` 
              : "> Click or drag files here for encryption"}
          </span>
        </label>
        {fileHandler.state.error && (
          <Alert variant="destructive" className="mt-4 mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fileHandler.state.error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Files List */}
      {fileHandler.state.selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-green-300 font-mono text-sm">{"> Selected Files:"}</h3>
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-mono text-xs">
                {fileHandler.state.selectedFiles.length} file(s) • {formatFileSize(fileHandler.state.selectedFiles.reduce((sum, file) => sum + file.size, 0))}
              </span>
              {fileHandler.state.selectedFiles.length > 1 && (
                <button
                  onClick={fileHandler.removeAllFiles}
                  className="group flex items-center gap-1 px-2 py-1 text-xs font-mono text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-400/50 rounded transition-all duration-200"
                  type="button"
                  title="Remove all files"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove All
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {fileHandler.state.selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 bg-green-950/20 rounded-lg border transition-all duration-200 cursor-move ${
                  draggedIndex === index 
                    ? 'border-green-400 bg-green-900/30 opacity-50' 
                    : dragOverIndex === index 
                    ? 'border-green-400 bg-green-900/20' 
                    : 'border-green-500/30'
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className={`flex-shrink-0 ${getFileTypeColor(file.name)}`}>
                    {getFileTypeIcon(file.name, "h-4 w-4")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-green-400 font-mono text-sm truncate">{file.name}</p>
                    <p className="text-xs text-green-600 font-mono">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => fileHandler.removeFile(index)}
                  className="group relative w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 flex-shrink-0"
                  type="button"
                  title="Remove file"
                >
                  <svg 
                    className="w-3 h-3 text-red-400 group-hover:text-red-300 transition-colors" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M9 3L3 9M3 3l6 6" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folder Name Input - Only show when multiple files are selected */}
      {fileHandler.state.selectedFiles.length > 1 && (
        <div className="space-y-2">
          <label className="block text-green-300 font-mono text-sm">
            {"> "}OUTPUT_FOLDER_NAME:
          </label>
          <div className="relative">
            <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
              className="w-full bg-black/40 border border-green-500/50 rounded pl-10 pr-4 py-3 text-green-300 font-mono focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
              placeholder="encrypted_files"
            />
          </div>
        </div>
      )}
      <div className="space-y-4">
        <label className="block text-green-300 font-mono text-sm">
          {"> "}ENCRYPTION_KEY:
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={passwordValidation.password}
            onChange={(e) => passwordValidation.updatePassword(e.target.value)}
            className="w-full bg-black/40 border border-green-500/50 rounded px-4 py-3 text-green-300 font-mono focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
            placeholder="Enter encryption password..."
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {passwordValidation.password.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-green-300 font-mono text-sm">
              <span>Password Strength: {passwordValidation.validation.strength.charAt(0).toUpperCase() + passwordValidation.validation.strength.slice(1)}</span>
              <div className="flex items-center gap-1">
                {passwordValidation.validation.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordValidation.validation.strength === "strong" ? "bg-green-500" :
                  passwordValidation.validation.strength === "medium" ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ 
                  width: `${
                    passwordValidation.validation.strength === "strong" ? 100 :
                    passwordValidation.validation.strength === "medium" ? 60 : 30
                  }%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {encryptionState.isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-green-300 font-mono text-sm">
            <span>{"> "}ENCRYPTING_FILE_{encryptionState.currentFileIndex + 1}_OF_{encryptionState.totalFiles}...</span>
            <span>{Math.round(encryptionState.progress)}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${encryptionState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {encryptionState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{encryptionState.error}</AlertDescription>
        </Alert>
      )}

      {/* Download Error Display */}
      {downloadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      {/* Success and Download */}
      {encryptedResult && (
        <div className="space-y-3">
          <Alert className="border-green-500/50 bg-green-950/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400 font-mono space-y-2">
              <div>
                {encryptedResult.files.length} file(s) encrypted successfully with military-grade encryption!
              </div>
              {encryptedResult.encryptionTime && (
                <div className="text-green-500 text-sm">
                  Encryption completed in {formatEncryptionTime(encryptedResult.encryptionTime)}
                </div>
              )}
              <div className="text-green-300 text-sm">
                You can now download the {encryptedResult.files.length === 1 ? 'encrypted file' : 'encrypted folder'}.
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {!encryptedResult ? (
          <button
            onClick={handleEncrypt}
            disabled={!canEncrypt || encryptionState.isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-500 text-black font-mono font-bold py-3 px-6 rounded transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {encryptionState.isProcessing ? "ENCRYPTING..." : "ENCRYPT FILES"}
          </button>
        ) : (
          <>
            <button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-mono font-bold py-3 px-6 rounded transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {encryptedResult.files.length === 1 ? 'DOWNLOAD ENCRYPTED FILE' : 'DOWNLOAD ENCRYPTED FOLDER'}
            </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-mono font-bold py-3 px-6 rounded transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            RESET ALL
          </button>
          </>
        )}
      </div>
    </div>
  )
}
