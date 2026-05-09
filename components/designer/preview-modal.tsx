"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CanvasArea } from "@/components/designer/canvas-area"
import { DESIGNER_FONTS } from "@/components/designer/designer-fonts"
import type { CanvasSize, DesignerDocument, DesignerPage } from "@/types/designer"

interface PreviewModalProps {
  documentState: DesignerDocument
  canvasSize: CanvasSize
  onClose: () => void
}

export function PreviewModal({ documentState, canvasSize, onClose }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative max-h-full max-w-5xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="mb-4 pr-10 text-xl font-semibold text-gray-950">Design Preview</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {(["front", "back"] as DesignerPage[]).map((page) => (
            <div key={page} className="space-y-2">
              <div className="text-sm font-medium capitalize text-gray-700">{page}</div>
              <div className="h-[390px] w-[302px] overflow-hidden border bg-gray-100">
                <CanvasArea
                  elements={documentState.pages[page]}
                  fonts={DESIGNER_FONTS}
                  selectedElement={null}
                  mode="select"
                  onModeChange={() => undefined}
                  onSelectElement={() => undefined}
                  zoom={35}
                  onZoomChange={() => undefined}
                  pan={{ x: 0, y: 0 }}
                  onPanChange={() => undefined}
                  onUpdateElement={() => undefined}
                  onDeleteElement={() => undefined}
                  onDropModule={() => undefined}
                  canvasSize={canvasSize}
                  showControls={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
