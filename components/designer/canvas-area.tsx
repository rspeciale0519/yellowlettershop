"use client"

import { useRef, useState } from "react"
import { Hand, MousePointer2, RotateCcw, Trash2, ZoomIn, ZoomOut } from "lucide-react"
import { Rnd } from "react-rnd"
import { Button } from "@/components/ui/button"
import { getFontFamily, type DesignerFont } from "@/components/designer/designer-fonts"
import { QrRenderer } from "@/components/designer/qr-renderer"
import type { CanvasSize, DesignElement, DesignerMode } from "@/types/designer"

interface CanvasAreaProps {
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
  onReplaceImageRequest?: (id: string) => void
  canvasSize?: CanvasSize
  showControls?: boolean
}

function clampZoom(nextZoom: number) {
  return Math.min(220, Math.max(25, Math.round(nextZoom)))
}

function snapPosition(element: DesignElement, x: number, y: number, elements: DesignElement[], canvasSize: CanvasSize) {
  const threshold = 8
  const guides = [32, canvasSize.width / 2, canvasSize.width - 32]
  const verticalGuides = [32, canvasSize.height / 2, canvasSize.height - 32]
  elements.forEach((item) => {
    if (item.id !== element.id && !item.hidden) {
      guides.push(item.x, item.x + item.width / 2, item.x + item.width)
      verticalGuides.push(item.y, item.y + item.height / 2, item.y + item.height)
    }
  })
  const candidatesX = [x, x + element.width / 2, x + element.width]
  const candidatesY = [y, y + element.height / 2, y + element.height]
  const snapX = guides.flatMap((guide) => candidatesX.map((candidate, index) => ({ guide, index, diff: Math.abs(guide - candidate) }))).sort((a, b) => a.diff - b.diff)[0]
  const snapY = verticalGuides.flatMap((guide) => candidatesY.map((candidate, index) => ({ guide, index, diff: Math.abs(guide - candidate) }))).sort((a, b) => a.diff - b.diff)[0]
  return {
    x: snapX?.diff <= threshold ? snapX.guide - (snapX.index === 1 ? element.width / 2 : snapX.index === 2 ? element.width : 0) : x,
    y: snapY?.diff <= threshold ? snapY.guide - (snapY.index === 1 ? element.height / 2 : snapY.index === 2 ? element.height : 0) : y,
  }
}

function RenderElement({
  element,
  fonts,
  editing,
  onEdit,
  onUpdate,
}: {
  element: DesignElement
  fonts: DesignerFont[]
  editing: boolean
  onEdit: () => void
  onUpdate: (updates: Partial<DesignElement>) => void
}) {
  if (element.type === "text") {
    const justifyContent = element.textAlign === "right" ? "flex-end" : element.textAlign === "center" ? "center" : "flex-start"
    return (
      <div
        contentEditable={editing && !element.locked}
        suppressContentEditableWarning
        onDoubleClick={onEdit}
        onBlur={(event) => onUpdate({ content: event.currentTarget.textContent || "" })}
        style={{
          fontSize: element.fontSize,
          fontWeight: element.fontWeight,
          fontFamily: getFontFamily(element.fontFamily, fonts),
          color: element.color ?? "#111827",
          textAlign: element.textAlign ?? "left",
          justifyContent,
        }}
        className="flex h-full w-full items-center p-1 outline-none"
      >
        {element.content}
      </div>
    )
  }

  if (element.type === "image") {
    if (element.src.startsWith("placeholder:")) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded border border-gray-300 bg-gray-100 px-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          {element.src.replace("placeholder:", "")}
        </div>
      )
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={element.src} alt={element.name} className="h-full w-full object-contain" />
    )
  }

  if (element.type === "graphic") {
    const radius = element.shape === "circle" ? "9999px" : element.shape === "badge" ? "12px" : "0"
    const height = element.shape === "line" ? Math.max(2, element.strokeWidth ?? 4) : "100%"
    return (
      <div
        className="h-full w-full"
        style={{
          background: element.shape === "line" ? element.stroke ?? element.fill : element.fill,
          border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.stroke ?? element.fill}` : undefined,
          borderRadius: radius,
          height,
        }}
      />
    )
  }

  if (element.type === "qr") {
    return (
      <QrRenderer value={element.value} foreground={element.foreground} background={element.background} alt={element.name} />
    )
  }

  return (
    <table className="h-full w-full border-collapse text-sm text-gray-950">
      <tbody>
        {element.cells.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, columnIndex) => (
              <td
                key={`${rowIndex}-${columnIndex}`}
                contentEditable={editing && !element.locked}
                suppressContentEditableWarning
                className={`border border-gray-400 px-2 py-1 outline-none ${
                  element.headerRow && rowIndex === 0 ? "bg-gray-100 font-semibold" : ""
                }`}
                onBlur={(event) => {
                  const cells = element.cells.map((item) => [...item])
                  cells[rowIndex][columnIndex] = event.currentTarget.textContent || ""
                  onUpdate({ cells })
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
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
  onReplaceImageRequest = () => undefined,
  canvasSize = { width: 862, height: 1112 },
  showControls = true,
}: CanvasAreaProps) {
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null)
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
        const moduleId = event.dataTransfer.getData("application/x-yls-module")
        const rect = viewportRef.current?.getBoundingClientRect()
        if (!moduleId || !rect) return
        onDropModule(moduleId, {
          x: (event.clientX - rect.left - currentPan.x) / canvasScale,
          y: (event.clientY - rect.top - currentPan.y) / canvasScale,
        })
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
          <div className="absolute inset-0 bg-white">
            <div className="absolute inset-8 border border-dashed border-gray-200" />
            <div className="absolute left-0 top-0 h-full w-5 bg-yellow-400" />
            <div className="absolute right-16 top-16 h-32 w-48 rounded-sm border border-gray-300 bg-gray-50" />
            <div className="absolute bottom-16 left-16 right-16 border-t border-gray-200 pt-6 text-xs uppercase tracking-wide text-gray-400">
              Direct mail preview
            </div>
          </div>
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
                onDragStop={(event, data) => onUpdateElement(element.id, snapPosition(element, data.x, data.y, elements, canvasSize))}
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
                style={{ zIndex: element.zIndex, opacity: element.opacity ?? 1 }}
                className={`border-2 ${
                  selectedElement === element.id ? "border-yellow-500" : "border-transparent hover:border-yellow-500/50"
                } ${element.locked ? "cursor-not-allowed" : ""}`}
              >
                {selectedElement === element.id && !element.locked && (
                  <div className="absolute -right-2 -top-10 z-50 flex rounded-md border border-gray-200 bg-white p-1 shadow-md">
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
