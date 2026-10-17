"use client"

import { Hand, Maximize2, MousePointer2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { ToolbarButton } from "@/components/designer/ui/toolbar-button"
import type { DesignerMode } from "@/types/designer"

interface CanvasControlsProps {
  mode: DesignerMode
  zoom: number
  onModeChange: (mode: DesignerMode) => void
  changeZoom: (zoom: number) => void
  onPanChange: (pan: { x: number; y: number }) => void
  onFit: () => void
}
export function CanvasControls({ mode, zoom, onModeChange, changeZoom, onPanChange, onFit }: CanvasControlsProps) {
  return (

        <div
          role="toolbar"
          aria-label="Canvas controls"
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg shadow-slate-900/10 dark:shadow-black/40"
        >
          <ToolbarButton active={mode === "select"} aria-label="Select tool" aria-pressed={mode === "select"} onClick={() => onModeChange("select")}>
            <MousePointer2 />
          </ToolbarButton>
          <ToolbarButton active={mode === "pan"} aria-label="Pan canvas" aria-pressed={mode === "pan"} onClick={() => onModeChange("pan")}>
            <Hand />
          </ToolbarButton>
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton aria-label="Zoom out" onClick={() => changeZoom(zoom - 10)}>
            <ZoomOut />
          </ToolbarButton>
          <input
            type="range"
            min={1}
            max={220}
            step={1}
            value={zoom}
            aria-label="Zoom level"
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="hidden h-1 w-24 sm:block cursor-pointer accent-yellow-400"
          />
          <ToolbarButton aria-label="Zoom in" onClick={() => changeZoom(zoom + 10)}>
            <ZoomIn />
          </ToolbarButton>
          <span className="w-12 text-center text-xs font-semibold tabular-nums text-foreground" aria-live="polite" aria-label={`Zoom ${zoom} percent`}>
            {zoom}%
          </span>
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            aria-label="Fit to screen"
            onClick={() => {
              onFit()
            }}
          >
            <Maximize2 />
          </ToolbarButton>
          <ToolbarButton
            aria-label="Actual size"
            onClick={() => {
              onPanChange({ x: 0, y: 0 })
              changeZoom(100)
            }}
          >
            <RotateCcw />
          </ToolbarButton>
        </div>

  )
}
