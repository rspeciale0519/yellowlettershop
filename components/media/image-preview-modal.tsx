"use client"

import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserAsset } from '@/types/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  asset: UserAsset | null
  allAssets: UserAsset[]
  currentIndex: number
  onNavigate: (direction: 'prev' | 'next') => void
}

export function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  asset, 
  allAssets, 
  currentIndex, 
  onNavigate 
}: ImagePreviewModalProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allAssets.length - 1

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        onNavigate('prev')
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate('next')
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasPrevious, hasNext, onNavigate, onClose])

  if (!asset || asset.file_type !== 'image') {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit max-w-[95vw] max-h-[95vh] p-0 flex flex-col" style={{ gap: 0 }}>
        <DialogTitle className="sr-only">{asset.filename}</DialogTitle>
        
        {/* Main Image Area with Navigation */}
        <div className="relative group">
          <img
            src={asset.file_url || "/placeholder.svg"}
            alt={asset.filename}
            className="w-full h-auto max-w-[94vw] max-h-[85vh] object-contain bg-muted rounded-t-lg flex-shrink-0 block"
            style={{ margin: 0, padding: 0, verticalAlign: 'bottom', marginBottom: 0 }}
            onError={(e) => {
              const imgElement = e.target as HTMLImageElement;
              imgElement.src = "/placeholder.svg";
            }}
          />
          
          {/* Navigation Arrows */}
          {hasPrevious && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {hasNext && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Position Indicator */}
          {allAssets.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {currentIndex + 1} of {allAssets.length}
            </div>
          )}
        </div>
        
        {/* File Details Section */}
        <div className="px-4 py-3 bg-background rounded-b-lg border-t flex items-center justify-between" style={{ marginTop: 0 }}>
          <h3 className="font-medium truncate mr-4" title={asset.filename}>
            {asset.filename}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatFileSize(asset.file_size)}</span>
            <span>{new Date(asset.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}