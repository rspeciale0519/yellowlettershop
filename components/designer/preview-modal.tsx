"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
          <div className="rounded-lg bg-slate-900 p-3">
            <RecipientPicker onSelect={setRecipient} />
          </div>
          <div className="space-y-2">
            <div className="flex h-[520px] items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
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
