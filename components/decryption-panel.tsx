"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Upload, AlertCircle, CheckCircle2, FileText, Eye, EyeOff, Lock, KeyRound, ShieldAlert } from "lucide-react"
import { useFileEncryption } from "@/hooks/use-file-encryption"
import { useFileHandler } from "@/hooks/use-file-handler"
import { useFileDownload } from "@/hooks/use-file-download"
import { formatFileSize } from "@/lib/file-utils"

export function DecryptionPanel() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [decryptedResult, setDecryptedResult] = useState<{ blob: Blob; filename: string; mimeType: string } | null>(
    null,
  )
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // Enhanced error categorization
  const getErrorDetails = (error: string) => {
    if (error.toLowerCase().includes("invalid password") || error.toLowerCase().includes("decryption failed")) {
      return {
        type: "password",
        icon: <KeyRound className="h-5 w-5" />,
        title: "Incorrect Password",
        message: "This password is not generating a reasonable/readable output.",
        suggestions: []
      }
    } else if (error.toLowerCase().includes("corrupted") || error.toLowerCase().includes("invalid file format")) {
      return {
        type: "file",
        icon: <ShieldAlert className="h-5 w-5" />,
        title: "File Corruption Detected",
        message: "The encrypted file appears to be corrupted or damaged.",
        suggestions: [
          "Try re-downloading the encrypted file",
          "Ensure the file wasn't modified after encryption",
          "Check if the file was completely uploaded/downloaded"
        ]
      }
    } else {
      return {
        type: "general",
        icon: <AlertCircle className="h-5 w-5" />,
        title: "Decryption Error",
        message: error,
        suggestions: []
      }
    }
  }

  const fileHandler = useFileHandler()
  const { state: encryptionState, decrypt, clearError } = useFileEncryption()
  const { downloadFile } = useFileDownload()

  const handleDecrypt = async () => {
    if (!fileHandler.state.selectedFile || !password.trim()) {
      return
    }

    clearError()
    setDownloadError(null)
    const result = await decrypt(fileHandler.state.selectedFile, password)

    if (result) {
      // Ensure we have a proper blob
      if (result.decryptedData && result.decryptedData.size > 0) {
        setDecryptedResult({
          blob: result.decryptedData,
          filename: result.filename,
          mimeType: result.mimeType,
        })
      } else {
        setDownloadError("Decryption produced invalid file data")
      }
    }
  }

  const handleDownload = async () => {
    if (!decryptedResult) {
      setDownloadError("No file available for download")
      return
    }

    try {
      setDownloadError(null)

      // Additional validation before download
      if (!decryptedResult.blob) {
        throw new Error("No file data available")
      }

      if (!(decryptedResult.blob instanceof Blob)) {
        throw new Error("Invalid file data: not a Blob")
      }

      if (decryptedResult.blob.size === 0) {
        throw new Error("File is empty")
      }

      await downloadFile(decryptedResult.blob, decryptedResult.filename)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed")
    }
  }

  const handleReset = () => {
    setDecryptedResult(null)
    setDownloadError(null)
    fileHandler.clearFile()
    setPassword("")
    clearError()
  }

  const canDecrypt = fileHandler.state.selectedFile && password.trim().length > 0 && !encryptionState.isProcessing

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
          onChange={(e) => e.target.files?.[0] && fileHandler.selectFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="decrypt-file"
          accept=".ag"
        />
        <label 
          htmlFor="decrypt-file" 
          className="block cursor-pointer p-8 text-center"
        >
          <Download className="mx-auto h-12 w-12 text-green-400 mb-4" />
          <span className="text-green-300 font-mono">
            {fileHandler.state.isDragOver
              ? "> Drop encrypted file here to decrypt"
              : fileHandler.state.selectedFile 
              ? `> ${fileHandler.state.selectedFile.name}` 
              : "> Click or drag encrypted file here to decrypt"}
          </span>
        </label>
        {fileHandler.state.error && (
          <Alert variant="destructive" className="mt-4 mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fileHandler.state.error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* File Info */}
      {fileHandler.state.selectedFile && (
        <div className="p-4 bg-green-950/20 rounded-lg border border-green-500/30">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-400 font-mono">{fileHandler.state.selectedFile.name}</p>
              <p className="text-sm text-green-600 font-mono">{formatFileSize(fileHandler.state.selectedFile.size)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Password Input */}
      <div className="space-y-4">
        <label className="block text-green-300 font-mono text-sm">
          {"> "}DECRYPTION_KEY:
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Lock className={`h-4 w-4 ${
              encryptionState.error && encryptionState.error.toLowerCase().includes("password") 
                ? "text-red-400" 
                : "text-green-500"
            }`} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (encryptionState.error) clearError() // Clear error when user starts typing
            }}
            className={`w-full bg-black/40 border rounded pl-10 pr-12 py-3 font-mono focus:outline-none focus:ring-1 transition-all duration-200 ${
              encryptionState.error && encryptionState.error.toLowerCase().includes("password")
                ? "border-red-500/50 text-red-300 focus:border-red-400 focus:ring-red-400/50 bg-red-950/20"
                : "border-green-500/50 text-green-300 focus:border-green-400 focus:ring-green-400"
            }`}
            placeholder="Enter decryption password..."
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
              encryptionState.error && encryptionState.error.toLowerCase().includes("password")
                ? "text-red-400 hover:text-red-300"
                : "text-green-400 hover:text-green-300"
            }`}
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Password strength indicator when typing */}
        {password.length > 0 && !encryptionState.error && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className={`w-2 h-2 rounded-full ${
              password.length >= 8 ? "bg-green-500" : "bg-yellow-500"
            }`}></div>
            <span className={password.length >= 8 ? "text-green-400" : "text-yellow-400"}>
              {password.length >= 8 ? "Password length OK" : `${8 - password.length} more characters recommended`}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      {encryptionState.isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-green-300 font-mono text-sm">
            <span>{"> "}DECRYPTING...</span>
            <span>{encryptionState.progress}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${encryptionState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Enhanced Error Display */}
      {encryptionState.error && (
        <div className="space-y-4">
          {(() => {
            const errorDetails = getErrorDetails(encryptionState.error)
            return (
              <div className="relative overflow-hidden rounded-lg border border-red-500/50 bg-gradient-to-r from-red-950/40 to-red-900/20 p-6">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 animate-pulse"></div>
                </div>
                
                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 rounded-full bg-red-500/20 border border-red-500/30">
                      {errorDetails.icon}
                    </div>
                    <div>
                      <h3 className="text-red-300 font-mono font-semibold text-lg">{errorDetails.title}</h3>
                      {errorDetails.message && (
                        <p className="text-red-400/80 font-mono text-sm">{errorDetails.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Suggestions - only show for non-password errors */}
                  {errorDetails.suggestions.length > 0 && errorDetails.type !== "password" && (
                    <div className="space-y-2">
                      <p className="text-red-300 font-mono text-sm font-medium">💡 Suggestions:</p>
                      <ul className="space-y-1">
                        {errorDetails.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-red-400/90 font-mono text-sm">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action button for password errors */}
                  {errorDetails.type === "password" && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setPassword("")
                          clearError()
                        }}
                        className="px-3 py-1 text-xs font-mono bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-400/60 text-red-300 hover:text-red-200 rounded transition-all duration-200"
                      >
                        Clear Password
                      </button>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 py-1 text-xs font-mono bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-400/60 text-red-300 hover:text-red-200 rounded transition-all duration-200 flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPassword ? "Hide" : "Show"} Password
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Download Error Display */}
      {downloadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      {/* Success and Download */}
      {decryptedResult && (
        <div className="space-y-4">
          <Alert className="border-green-500/50 bg-green-950/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400 font-mono">
              File decrypted successfully! Original file: <strong>{decryptedResult.filename}</strong>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-green-950/20 rounded-lg border border-green-500/30">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-400 font-mono">{decryptedResult.filename}</p>
                <p className="text-sm text-green-600 font-mono">
                  Ready for download • {decryptedResult.mimeType} • {formatFileSize(decryptedResult.blob.size)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {!decryptedResult ? (
          <button
            onClick={handleDecrypt}
            disabled={!canDecrypt || encryptionState.isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-500 text-black font-mono font-bold py-3 px-6 rounded transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {encryptionState.isProcessing ? "DECRYPTING..." : "DECRYPT FILE"}
          </button>
        ) : (
          <>
            <button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-mono font-bold py-3 px-6 rounded transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              DOWNLOAD ORIGINAL FILE
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 border border-green-500/50 text-green-400 hover:bg-green-900/20 rounded font-mono"
            >
              Decrypt Another File
            </button>
          </>
        )}
      </div>
    </div>
  )
}
