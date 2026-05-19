"use client"

import "react-image-crop/dist/ReactCrop.css"
import { useRef, useState } from "react"
import ReactCrop, { type Crop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ImageCropDialog({
  src,
  onCropped,
}: {
  src: string
  onCropped: (dataUrl: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 10, y: 10, width: 80, height: 80 })
  const imgRef = useRef<HTMLImageElement | null>(null)

  const apply = () => {
    const image = imgRef.current
    if (!image) return
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const pxX = (crop.unit === "%" ? (crop.x / 100) * image.width : crop.x) * scaleX
    const pxY = (crop.unit === "%" ? (crop.y / 100) * image.height : crop.y) * scaleY
    const pxW = (crop.unit === "%" ? (crop.width / 100) * image.width : crop.width) * scaleX
    const pxH = (crop.unit === "%" ? (crop.height / 100) * image.height : crop.height) * scaleY
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(pxW))
    canvas.height = Math.max(1, Math.round(pxH))
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(image, pxX, pxY, pxW, pxH, 0, 0, canvas.width, canvas.height)
    onCropped(canvas.toDataURL("image/png"))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full bg-transparent">
          Crop image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={src} alt="" crossOrigin="anonymous" className="max-w-full" />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={apply}>
            Apply crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
