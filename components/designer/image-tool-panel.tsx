"use client"

import { useRef } from "react"
import type { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface ImageToolPanelProps {
  images?: string[]
  onUploadImage?: (src: string) => void
  onInsertImage?: (src: string) => void
}

export function ImageToolPanel({ images = [], onUploadImage, onInsertImage }: ImageToolPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUploadImage?.(reader.result)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Images</h3>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <Button variant="outline" className="w-full bg-transparent" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Upload Image
      </Button>
      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              className="overflow-hidden rounded border border-gray-200 bg-white p-1 hover:border-yellow-500"
              onClick={() => onInsertImage?.(src)}
              aria-label={`Insert uploaded image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Uploaded images will appear here.
        </div>
      )}
    </div>
  )
}
