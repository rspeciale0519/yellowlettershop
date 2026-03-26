import { X, FileImage, File, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface FilePreviewListProps {
  files: File[]
  onRemove: (index: number) => void
}

interface FilePreviewItemProps {
  file: File
  index: number
  onRemove: (index: number) => void
}

function FilePreviewItem({ file, index, onRemove }: FilePreviewItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file])

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />
    }
    if (type.includes('pdf')) {
      return <File className="h-8 w-8 text-red-500" />
    }
    if (type.includes('spreadsheet') || type.includes('excel') || type === 'text/csv') {
      return <File className="h-8 w-8 text-green-500" />
    }
    return <FileText className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Image preview or file icon */}
            <div className="flex-shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="h-12 w-12 object-cover rounded border"
                />
              ) : (
                getFileIcon(file.type)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function FilePreviewList({ files, onRemove }: FilePreviewListProps) {
  return (
    <div className="max-h-64 overflow-y-auto space-y-2">
      {files.map((file, index) => (
        <FilePreviewItem
          key={`${file.name}-${index}`}
          file={file}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}