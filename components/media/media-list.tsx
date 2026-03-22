"use client"

import { FileImage, File, FileText, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface MediaListProps {
  files: any[]
  onFileSelect: (id: string) => Promise<string>
  onFileDelete: (id: string) => Promise<void>
  onFileUpdate: (id: string, updates: any) => Promise<void>
  formatFileSize: (size: number) => string
}

export function MediaList({ 
  files, 
  onFileSelect, 
  onFileDelete, 
  onFileUpdate, 
  formatFileSize 
}: MediaListProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-5 w-5 text-blue-500" />
      case "pdf":
        return <File className="h-5 w-5 text-red-500" />
      case "document":
        return <FileText className="h-5 w-5 text-green-500" />
      case "spreadsheet":
        return <FileText className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const handleFileClick = async (file: any) => {
    if (file.file_type === 'image') {
      try {
        await onFileSelect(file.id)
        // Handle preview
      } catch (error) {
        console.error('Failed to get signed URL:', error)
      }
    }
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No media files found</h3>
        <p className="text-muted-foreground">Upload some files to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {/* File Icon/Thumbnail */}
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
            {file.file_type === 'image' && file.metadata?.thumbnail ? (
              <img
                src={file.metadata.thumbnail}
                alt={file.filename}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              getFileIcon(file.file_type)
            )}
          </div>

          {/* File Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{file.filename}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatFileSize(file.file_size)}</span>
              <span>{new Date(file.created_at).toLocaleDateString()}</span>
            </div>
            
            {/* Tags */}
            {file.metadata?.tags && file.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {file.metadata.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {file.metadata.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{file.metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFileClick(file)}>
                {file.file_type === 'image' ? 'Preview' : 'View Details'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onFileDelete(file.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  )
}