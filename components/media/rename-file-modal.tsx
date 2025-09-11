"use client"

import React, { useState, useEffect } from 'react'
import { UserAsset } from '@/types/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface RenameFileModalProps {
  isOpen: boolean
  asset: UserAsset | null
  onClose: () => void
  onSubmit: (asset: UserAsset, newName: string) => Promise<void>
}

export function RenameFileModal({
  isOpen,
  asset,
  onClose,
  onSubmit
}: RenameFileModalProps) {
  const [newName, setNewName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Initialize form with current filename (without extension)
  useEffect(() => {
    if (asset) {
      // Remove file extension from filename for editing
      const nameWithoutExt = asset.filename.replace(/\.[^/.]+$/, '')
      setNewName(nameWithoutExt)
      setError('')
    }
  }, [asset])

  const validateFileName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Filename cannot be empty'
    }
    
    if (name.trim().length > 100) {
      return 'Filename must be less than 100 characters'
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      return 'Filename contains invalid characters: < > : " / \\ | ? *'
    }
    
    return null
  }

  const getFileExtension = (filename: string): string => {
    const match = filename.match(/\.[^/.]+$/)
    return match ? match[0] : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!asset) return
    
    const trimmedName = newName.trim()
    const validationError = validateFileName(trimmedName)
    
    if (validationError) {
      setError(validationError)
      return
    }

    // Add the original file extension back
    const extension = getFileExtension(asset.filename)
    const fullNewName = trimmedName + extension

    // Check if name actually changed
    if (fullNewName === asset.filename) {
      onClose()
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(asset, fullNewName)
      onClose()
    } catch (error) {
      console.error('Rename error:', error)
      setError(error instanceof Error ? error.message : 'Failed to rename file')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!asset) return null

  const extension = getFileExtension(asset.filename)
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Enter a new name for &quot;{asset.filename}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">File Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter file name"
                disabled={isSubmitting}
                className="flex-1"
              />
              {extension && (
                <span className="text-sm text-muted-foreground font-mono">
                  {extension}
                </span>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !newName.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}