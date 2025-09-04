"use client"

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedImageBlob: Blob) => void
  imageFile: File | null
}

export function ImageCropModal({ isOpen, onClose, onCropComplete, imageFile }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageSrc, setImageSrc] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load image when file changes
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile])

  // Set initial crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    
    // Create a square crop centered in the image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 50,
        },
        1, // aspect ratio 1:1 for square
        width,
        height
      ),
      width,
      height
    )
    
    setCrop(crop)
  }, [])

  // Handle crop completion
  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return

    setProcessing(true)
    
    try {
      const canvas = canvasRef.current
      const image = imgRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('No 2d context')

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      // Set canvas size to desired output size (square)
      const outputSize = 400 // 400x400 px output
      canvas.width = outputSize
      canvas.height = outputSize

      // Draw the cropped image
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        outputSize,
        outputSize
      )

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob)
          onClose()
        }
      }, 'image/jpeg', 0.9)
      
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setProcessing(false)
    }
  }, [completedCrop, onCropComplete, onClose])

  const handleCancel = () => {
    setImageSrc('')
    setCrop(undefined)
    setCompletedCrop(undefined)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Crop Your Profile Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {imageSrc && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // Square aspect ratio
                minWidth={50}
                minHeight={50}
                keepSelection
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              </ReactCrop>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground text-center">
            Drag to reposition and resize the crop area. The final image will be square.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleCropComplete} 
            disabled={!completedCrop || processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Apply Crop'
            )}
          </Button>
        </DialogFooter>

        {/* Hidden canvas for processing */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </DialogContent>
    </Dialog>
  )
}