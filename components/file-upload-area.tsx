"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, File } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/file-utils"

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onClear: () => void
  isDragOver: boolean
  onDragOver: (event: React.DragEvent) => void
  onDragLeave: (event: React.DragEvent) => void
  onDrop: (event: React.DragEvent) => void
  accept?: string
  placeholder?: string
  className?: string
}

export function FileUploadArea({
  onFileSelect,
  selectedFile,
  onClear,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  accept = "*",
  placeholder = "Drop your file here or click to browse",
  className,
}: FileUploadAreaProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  if (selectedFile) {
    return (
      <div className="p-6 border-2 border-dashed border-green-200 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-sm text-green-700">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            onClick={onClear}
            variant="ghost"
            size="sm"
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors",
        isDragOver
          ? "border-blue-400 bg-blue-50"
          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
        className
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="p-8 text-center">
        <Upload className={cn("mx-auto h-12 w-12 mb-4", isDragOver ? "text-blue-500" : "text-slate-400")} />
        <p className={cn("text-lg font-medium mb-2", isDragOver ? "text-blue-700" : "text-slate-700")}>
          {isDragOver ? "Drop file here" : placeholder}
        </p>
        <p className="text-sm text-slate-500">
          {accept === ".ag" ? "Only .ag files are supported" : "Maximum file size: 1GB"}
        </p>
      </div>
    </div>
  )
}
