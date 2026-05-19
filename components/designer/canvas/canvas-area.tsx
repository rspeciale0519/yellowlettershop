"use client"

import { useRef, useState } from "react"
import { Copy, Hand, Lock, MousePointer2, RotateCcw, Trash2, Unlock, ZoomIn, ZoomOut } from "lucide-react"
import { Rnd } from "react-rnd"
import { Button } from "@/components/ui/button"
import type { DesignerFont } from "@/components/designer/designer-fonts"
import { RenderElement } from "@/components/designer/canvas/render-element"
import { computeSnap, snapPosition, type SnapGuide } from "@/components/designer/canvas/snap"
import { SnapGuides } from "@/components/designer/canvas/snap-guides"
import { CanvasEmptyState } from "@/components/designer/canvas/canvas-empty-state"
import { PrintOverlay } from "@/components/designer/canvas/print-overlay"
import { PageBackgroundLayer } from "@/components/designer/page-background-layer"
import { dropPointToCanvas, readDragPayload } from "@/components/designer/dnd"
import type { SpecRects } from "@/components/designer/mail-spec"
import type { CanvasSize, DesignElement, DesignerImageAsset, DesignerMode, PageBackground } from "@/types/designer"

export interface CanvasAreaProps {
  elements: DesignElement[]
  fonts?: DesignerFont[]
  selectedElement: string | null
  mode?: DesignerMode
  onModeChange?: (mode: DesignerMode) => void
  onSelectElement: (id: string | null) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  pan?: { x: number; y: number }
  onPanChange?: (pan: { x: number; y: number }) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onDeleteElement?: (id: string) => void
  onDropModule?: (moduleId: string, position: { x: number; y: number }) => void
  onDropAsset?: (asset: DesignerImageAsset, position: { x: number; y: number }) => void
  onReplaceImageRequest?: (id: string) => void
  onDuplicateElement?: (id: string) => void
  onToggleLock?: (id: string) => void
  canvasSize?: CanvasSize
  specRects?: SpecRects
  background?: PageBackground
  showControls?: boolean
}

function clampZoom(nextZoom: number) {
  return Math.min(220, Math.max(25, Math.round(nextZoom)))
}

export function CanvasArea({
  elements,
  fonts = [],
  selectedElement,
  mode = "select",
  onModeChange = () => undefined,
  onSelectElement,
  zoom,
  onZoomChange,
  pan = { x: 0, y: 0 },
  onPanChange = () => undefined,
  onUpdateElement,
  onDeleteElement = () => undefined,
  onDropModule = () => undefined,
  onDropAsset = () => undefined,
  onReplaceImageRequest = () => undefined,
  onDuplicateElement = () => undefined,
  onToggleLock = () => undefined,
  canvasSize = { width: 862, height: 1112 },
  specRects,
  background,
  showControls = true,
}: CanvasAreaProps) {
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const visibleCount = elements.filter((element) => !element.hidden).length
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const canvasScale = zoom / 100
  const currentPan = pan ?? { x: 0, y: 0 }

  const changeZoom = (nextZoom: number) => onZoomChange(clampZoom(nextZoom))

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-hidden bg-gray-200 dark:bg-gray-950 ${
        mode === "pan" ? "cursor-grab" : "cursor-default"
      }`}
      onWheel={(event) => {
        if (!showControls || !event.ctrlKey) return
        event.preventDefault()
        changeZoom(zoom + (event.deltaY > 0 ? -8 : 8))
      }}
      onMouseDown={(event) => {
        if (mode !== "pan" || !showControls) return
        setPanStart({ x: event.clientX, y: event.clientY, panX: currentPan.x, panY: currentPan.y })
      }}
      onMouseMove={(event) => {
        if (!panStart) return
        onPanChange({
          x: panStart.panX + event.clientX - panStart.x,
          y: panStart.panY + event.clientY - panStart.y,
        })
      }}
      onMouseUp={() => setPanStart(null)}
      onMouseLeave={() => setPanStart(null)}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      }}
      onDrop={(event) => {
        event.preventDefault()
        const payload = readDragPayload(event.dataTransfer)
        const rect = viewportRef.current?.getBoundingClientRect()
        if (!payload || !rect) return
        const position = dropPointToCanvas(event, rect, currentPan, canvasScale)
        if (payload.kind === "module") onDropModule(payload.moduleId, position)
        else onDropAsset(payload.asset, position)
      }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(calc(-50% + ${currentPan.x}px), calc(-50% + ${currentPan.y}px)) scale(${canvasScale})` }}
      >
        <div
          className="relative bg-white text-gray-950 shadow-lg"
          style={{ width: canvasSize.width, height: canvasSize.height }}
          onClick={() => {
            onSelectElement(null)
            setEditingElement(null)
          }}
        >
          <PageBackgroundLayer background={background} />
          {visibleCount === 0 && <CanvasEmptyState />}
          {elements
            .filter((element) => !element.hidden)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <Rnd
                key={element.id}
                size={{ width: element.width, height: element.height }}
                position={{ x: element.x, y: element.y }}
                scale={canvasScale}
                disableDragging={mode === "pan" || element.locked || editingElement === element.id}
                enableResizing={mode === "select" && !element.locked}
                onDrag={(event, data) => setActiveGuides(computeSnap(element, data.x, data.y, elements, canvasSize).guides)}
                onDragStop={(event, data) => {
                  setActiveGuides([])
                  onUpdateElement(element.id, snapPosition(element, data.x, data.y, elements, canvasSize))
                }}
                onResizeStop={(event, direction, ref, delta, position) => {
                  onUpdateElement(element.id, {
                    width: Number.parseInt(ref.style.width, 10),
                    height: Number.parseInt(ref.style.height, 10),
                    ...position,
                  })
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectElement(element.id)
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  if (element.type === "image" && !element.locked) {
                    onReplaceImageRequest(element.id)
                    return
                  }
                  setEditingElement(element.id)
                }}
                style={{
                  zIndex: element.zIndex,
                  opacity: element.opacity ?? 1,
                  transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                }}
                className={`border-2 ${
                  selectedElement === element.id ? "border-yellow-500" : "border-transparent hover:border-yellow-500/50"
                } ${element.locked ? "cursor-not-allowed" : ""}`}
              >
                {selectedElement === element.id && (
                  <div
                    className={`absolute -right-2 z-50 flex rounded-md border border-gray-200 bg-white p-1 shadow-md ${
                      element.y < 44 ? "-bottom-10" : "-top-10"
                    }`}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`${element.locked ? "Unlock" : "Lock"} ${element.name}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleLock(element.id)
                      }}
                    >
                      {element.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>
                    {!element.locked && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Duplicate ${element.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDuplicateElement(element.id)
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${element.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteElement(element.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
                <RenderElement
                  element={element}
                  fonts={fonts}
                  editing={editingElement === element.id}
                  onEdit={() => setEditingElement(element.id)}
                  onUpdate={(updates) => onUpdateElement(element.id, updates)}
                />
              </Rnd>
            ))}
          <SnapGuides guides={activeGuides} />
          <PrintOverlay specRects={specRects} />
        </div>
      </div>

      {showControls && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white p-2 shadow-md dark:bg-gray-800">
          <Button variant={mode === "select" ? "default" : "ghost"} size="icon" onClick={() => onModeChange("select")}>
            <MousePointer2 className="h-5 w-5" />
          </Button>
          <Button variant={mode === "pan" ? "default" : "ghost"} size="icon" onClick={() => onModeChange("pan")}>
            <Hand className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <Button variant="ghost" size="icon" onClick={() => changeZoom(zoom - 10)}>
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="w-14 text-center text-sm font-semibold">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={() => changeZoom(zoom + 10)}>
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onPanChange({ x: 0, y: 0 })
              changeZoom(70)
            }}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
