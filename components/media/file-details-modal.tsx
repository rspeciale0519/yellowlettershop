"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Copy } from 'lucide-react'
import { UserAsset } from '@/types/supabase'

interface FileDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  asset: UserAsset | null
  onDownload?: (asset: UserAsset) => void
  onCopyLink?: (asset: UserAsset) => void
}

export function FileDetailsModal({ isOpen, onClose, asset, onDownload, onCopyLink }: FileDetailsModalProps) {
  if (!asset) return null

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    const iconClasses = "h-12 w-12"
    
    switch (fileType) {
      case 'image':
        return (
          <svg className={`${iconClasses} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'document':
        return (
          <svg className={`${iconClasses} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'video':
        return (
          <svg className={`${iconClasses} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'audio':
        return (
          <svg className={`${iconClasses} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      default:
        return (
          <svg className={`${iconClasses} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(asset)
    }
  }

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink(asset)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>File Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center justify-center rounded-md border bg-muted p-2">
            {asset.file_type === "image" ? (
              <img
                src={asset.file_url || "/placeholder.svg"}
                alt={asset.filename}
                className="max-h-[200px] w-auto object-contain"
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement;
                  const container = imgElement.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <div class="flex h-[200px] w-full items-center justify-center">
                        <svg class="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="flex h-[200px] w-full items-center justify-center">
                {getFileIcon(asset.file_type)}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium break-words">{asset.filename}</h3>
              <p className="text-sm text-muted-foreground capitalize">{asset.file_type} file</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Size:</span>
                <span>{formatFileSize(asset.file_size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Created:</span>
                <span>{new Date(asset.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Tags: </span>
                <span className="break-words">{asset.metadata?.tags?.join(", ") || "None"}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}