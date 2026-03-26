"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Download,
  Edit,
  Copy,
  Trash,
  FileText,
  Loader2,
  Eye,
  Tag
} from 'lucide-react'
import { UserAsset } from '@/types/supabase'
import { useAssets } from '@/hooks/use-assets'
import { toast } from 'sonner'

interface FileActionsProps {
  asset: UserAsset
  onDelete?: (asset: UserAsset) => void
  onShowDetails?: (asset: UserAsset) => void
  onRename?: (asset: UserAsset, newName: string) => void
  onOpenRenameModal?: (asset: UserAsset) => void
  onViewFile?: (asset: UserAsset) => void
  onManageTags?: (asset: UserAsset) => void
}

export function FileActions({ asset, onDelete, onShowDetails, onRename, onOpenRenameModal, onViewFile, onManageTags }: FileActionsProps) {
  const { getSignedUrl } = useAssets()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopyingLink, setIsCopyingLink] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!asset.file_path) {
      toast.error('File path not available for download')
      return
    }

    setIsDownloading(true)
    try {
      const signedUrl = await getSignedUrl(asset.id, 3600)
      
      // Fetch the file as a blob to ensure it downloads rather than opening
      const response = await fetch(signedUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = asset.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)
      
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    setIsCopyingLink(true)
    try {
      // Generate clean share link
      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: asset.id,
          expiresInDays: 30 // 30 day expiration for shared links
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate share link')
      }
      
      const { shareUrl } = await response.json()
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      console.error('Copy link failed:', error)
      toast.error('Failed to copy link. Please try again.')
    } finally {
      setIsCopyingLink(false)
    }
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (onOpenRenameModal) {
      onOpenRenameModal(asset)
    } else if (onRename) {
      // Fallback to prompt for backward compatibility
      const newName = prompt('Enter new file name:', asset.filename)
      if (newName && newName !== asset.filename) {
        onRename(asset, newName.trim())
      }
    }
  }

  const handleShowDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShowDetails) {
      onShowDetails(asset)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(asset)
    }
  }

  const handleViewFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onViewFile) {
      onViewFile(asset)
    }
  }

  const handleManageTags = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onManageTags) {
      onManageTags(asset)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {asset.file_type === "image" && onViewFile && (
          <DropdownMenuItem onClick={handleViewFile}>
            <Eye className="mr-2 h-4 w-4" />
            View File
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleShowDetails}>
          <FileText className="mr-2 h-4 w-4" />
          File Details
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleRename}>
          <Edit className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleManageTags}>
          <Tag className="mr-2 h-4 w-4" />
          Tags
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleCopyLink}
          disabled={isCopyingLink}
        >
          {isCopyingLink ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Link
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={handleDeleteClick}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}