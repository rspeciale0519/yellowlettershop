"use client"

import { useMemo, useState } from "react"
import { CanvasArea } from "@/components/designer/canvas-area"
import { DESIGNER_FONTS } from "@/components/designer/designer-fonts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RecipientPicker } from "@/components/designer/preview/recipient-picker"
import { buildTokenContext } from "@/components/designer/tokens/recipient-map"
import { substituteDocument } from "@/components/designer/tokens/token-engine"
import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"
import type { CanvasSize, DesignerDocument, DesignerPage } from "@/types/designer"

interface PreviewModalProps {
  documentState: DesignerDocument
  canvasSize: CanvasSize
  onClose: () => void
}

export function PreviewModal({ documentState, canvasSize, onClose }: PreviewModalProps) {
  const [recipient, setRecipient] = useState<RecipientDTO | null>(null)

  const previewDoc = useMemo(() => {
    if (!recipient) return documentState
    return substituteDocument(documentState, buildTokenContext(recipient, {}))
  }, [documentState, recipient])

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Design Preview</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 mb-2 text-xs text-gray-500">
          On-screen proof — not the final print file. Pick a recipient to see the
          personalized result.
        </p>
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-lg bg-slate-900 p-3">
            <RecipientPicker onSelect={setRecipient} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {(["front", "back"] as DesignerPage[]).map((page) => (
              <div key={page} className="space-y-2">
                <div className="text-sm font-medium capitalize text-gray-700">{page}</div>
                <div className="h-[390px] w-full overflow-hidden border bg-gray-100">
                  <CanvasArea
                    elements={previewDoc.pages[page]}
                    fonts={DESIGNER_FONTS}
                    selectedElement={null}
                    mode="select"
                    onSelectElement={() => undefined}
                    zoom={35}
                    onZoomChange={() => undefined}
                    pan={{ x: 0, y: 0 }}
                    onUpdateElement={() => undefined}
                    canvasSize={canvasSize}
                    background={previewDoc.backgrounds?.[page]}
                    showControls={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
