"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Download, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RecipientPicker } from "@/components/designer/preview/recipient-picker"
import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"
import type { CanvasSize, DesignerDocument } from "@/types/designer"

// Lazy so the three.js chunk loads only when the 3D tab is opened — the
// designer page statically imports this modal.
const Design3DPreview = dynamic(() => import("@/components/design-preview-3d/Design3DPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading 3D viewer…
    </div>
  ),
})

interface PreviewModalProps {
  documentState: DesignerDocument
  canvasSize: CanvasSize
  onClose: () => void
}

interface PreviewResult {
  pdfUrl: string
  widthIn: number
  heightIn: number
  dpi: number
}

export function PreviewModal({ documentState, onClose }: PreviewModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [recipient, setRecipient] = useState<RecipientDTO | null>(null)
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"pdf" | "3d">("pdf")

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch("/api/design/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          designState: documentState,
          formatId: documentState.formatId,
          orientation: documentState.orientation,
          recipient: recipient ?? undefined,
          addCropMarks: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Preview generation failed")
      setResult({ pdfUrl: json.pdfUrl, widthIn: json.widthIn, heightIn: json.heightIn, dpi: json.dpi })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview generation failed")
    } finally {
      setLoading(false)
    }
  }, [documentState, recipient, supabase])

  useEffect(() => {
    void generate()
  }, [generate])

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Design Preview</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 mb-2 text-xs text-gray-500">
          Print-ready proof (300 DPI, full bleed + crop marks). Pick a recipient
          to personalize.
        </p>
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-lg bg-card p-3">
            <RecipientPicker onSelect={setRecipient} />
          </div>
          <div className="space-y-2">
            <div className="inline-flex rounded-md border p-0.5" role="tablist" aria-label="Preview mode">
              <Button
                type="button"
                role="tab"
                aria-selected={view === "pdf"}
                variant={view === "pdf" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("pdf")}
              >
                Print PDF
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={view === "3d"}
                variant={view === "3d" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("3d")}
              >
                3D preview
              </Button>
            </div>
            <div className="h-[520px] overflow-hidden rounded-lg border bg-gray-100">
              {view === "3d" ? (
                // Mounted only while selected — no hidden live WebGL context.
                <div className="h-full w-full bg-white p-3">
                  <Design3DPreview documentState={documentState} recipient={recipient} />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Rendering print proof…
                    </div>
                  )}
                  {!loading && error && (
                    <div className="space-y-2 text-center text-sm text-red-600">
                      <p>{error}</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => void generate()}>
                        Retry
                      </Button>
                    </div>
                  )}
                  {!loading && !error && result && (
                    <iframe title="Design proof" src={result.pdfUrl} className="h-full w-full" />
                  )}
                </div>
              )}
            </div>
            {result && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {result.widthIn.toFixed(2)}″ × {result.heightIn.toFixed(2)}″ @ {result.dpi} DPI · front + back · RGB
                </span>
                <a href={result.pdfUrl} download className="inline-flex items-center gap-1 text-yellow-700 hover:underline">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
