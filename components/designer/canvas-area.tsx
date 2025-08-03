"use client"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Settings } from "lucide-react"
import { Rnd } from "react-rnd"
import type { DesignElement } from "@/types/designer"
import Image from "next/image"

interface CanvasAreaProps {
  elements: DesignElement[]
  selectedElement: string | null
  onSelectElement: (id: string | null) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
}

export function CanvasArea({
  elements,
  selectedElement,
  onSelectElement,
  zoom,
  onZoomChange,
  onUpdateElement,
}: CanvasAreaProps) {
  const canvasWidth = 862
  const canvasHeight = 1112

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className="relative bg-white shadow-lg overflow-hidden"
        style={{
          width: canvasWidth * (zoom / 100),
          height: canvasHeight * (zoom / 100),
          transform: `scale(${zoom / 100})`,
          transformOrigin: "center",
        }}
        onClick={() => onSelectElement(null)}
      >
        {/* This is a placeholder for the actual design canvas */}
        <Image
          src="/placeholder.svg?height=1112&width=862&text=Your+Design+Here"
          alt="Design Canvas"
          width={canvasWidth}
          height={canvasHeight}
          className="absolute inset-0 w-full h-full object-cover"
          unoptimized // Added unoptimized prop
        />

        {elements.map((el) => (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            onDragStop={(e, d) => {
              onUpdateElement(el.id, { x: d.x, y: d.y })
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onUpdateElement(el.id, {
                width: Number.parseInt(ref.style.width),
                height: Number.parseInt(ref.style.height),
                ...position,
              })
            }}
            onClick={(e) => {
              e.stopPropagation()
              onSelectElement(el.id)
            }}
            className={`border-2 ${
              selectedElement === el.id ? "border-yellow-500" : "border-transparent hover:border-yellow-500/50"
            }`}
          >
            {el.type === "text" && (
              <div
                style={{ fontSize: el.fontSize, fontWeight: el.fontWeight }}
                className="w-full h-full flex items-center justify-center p-1"
              >
                {el.content}
              </div>
            )}
            {el.type === "image" && el.src && (
              <div className="relative w-full h-full">
                <Image
                  src={el.src || "/placeholder.svg"}
                  alt="Custom image"
                  fill
                  className="object-cover"
                  unoptimized
                />{" "}
                {/* Added unoptimized prop */}
              </div>
            )}
          </Rnd>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
        <Button variant="ghost" size="icon" onClick={() => onZoomChange(Math.max(10, zoom - 10))}>
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Slider
          value={[zoom]}
          onValueChange={(value) => onZoomChange(value[0])}
          min={10}
          max={200}
          step={10}
          className="w-32"
        />
        <Button variant="ghost" size="icon" onClick={() => onZoomChange(Math.min(200, zoom + 10))}>
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
