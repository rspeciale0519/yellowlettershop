"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Download, Loader2 } from "lucide-react"
import { useDesignerTextLayout } from "@/components/designer/writing/text-layout-context"
import { SAMPLE_VALUES } from "@/lib/designer/text/resolve-values"
import { buildTokenContext } from "@/components/designer/tokens/recipient-map"
import { normalizeDesignerDocument } from "@/lib/designer/document/normalize"
import { getDesignSpread, getPrintedPages } from "@/lib/designer/document/pages"
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
  pageCount?: number
}

export function PreviewModal({ documentState, onClose }: PreviewModalProps) {
  const context = useDesignerTextLayout()
  const doc=useMemo(()=>normalizeDesignerDocument(documentState),[documentState])
  const [selectedPage,setSelectedPage]=useState(context?.pageId ?? "front")
  const supabase = useMemo(() => createClient(), [])
  const [recipient, setRecipient] = useState<RecipientDTO | null>(context?.recipient ?? null)
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"pdf" | "3d">("pdf")
  const request = useRef<{generation:number;controller?:AbortController}>({generation:0})
  const setCanvasRecipient=context?.setRecipient
  const selectRecipient=useCallback((next:RecipientDTO|null)=>{setRecipient(next);setCanvasRecipient?.(next)},[setCanvasRecipient])

  const sender=useMemo(()=>context?.sender ?? {},[context?.sender])
  const sampleValues=context?.values ?? SAMPLE_VALUES
  const effectiveRecipient=useMemo(()=>recipient ?? {id:'sample',firstName:sampleValues.first_name,lastName:sampleValues.last_name,addressLine1:sampleValues.address_line_1,addressLine2:sampleValues.address_line_2,city:sampleValues.city,state:sampleValues.state,zipCode:sampleValues.zip_code,company:sampleValues.company,email:sampleValues.email,phone:sampleValues.phone},[recipient,sampleValues])
  const effectiveSender=useMemo(()=>Object.values(sender).some(Boolean)?sender:{firstName:sampleValues.sender_first,lastName:sampleValues.sender_last,phone:sampleValues.sender_phone,company:sampleValues.sender_company,email:sampleValues.sender_email},[sender,sampleValues])
  const values=useMemo(()=>buildTokenContext(effectiveRecipient,effectiveSender).values,[effectiveRecipient,effectiveSender])
  const generate = useCallback(async () => {
    request.current.controller?.abort()
    const generation=++request.current.generation
    const controller=new AbortController()
    request.current.controller=controller
    const current=()=>request.current.generation===generation && !controller.signal.aborted
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await supabase.auth.getSession()
      if(!current()) return
      const token = data.session?.access_token
      const res = await fetch("/api/design/preview", {
        method: "POST",
        signal:controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          designState: documentState,
          formatId: documentState.formatId,
          orientation: documentState.orientation,
          recipient: effectiveRecipient,
          sender: effectiveSender,
          addCropMarks: true,
        }),
      })
      const json = await res.json()
      if(!current()) return
      if (!res.ok) throw new Error(json?.error ?? "Preview generation failed")
      setResult({ pdfUrl: json.pdfUrl, widthIn: json.widthIn, heightIn: json.heightIn, dpi: json.dpi, pageCount: json.pageCount ?? doc.pageOrder.filter(id=>doc.pageSettings[id].printIncluded).length })
    } catch (e) {
      if(current()) setError(e instanceof Error ? e.message : "Preview generation failed")
    } finally {
      if(current()) setLoading(false)
    }
  }, [documentState, effectiveRecipient, effectiveSender, supabase, doc])

  useEffect(() => {
    void generate()
    const active=request.current
    return()=>{active.controller?.abort();active.generation++}
  }, [generate])

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle>Design Preview</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 mb-2 text-xs text-gray-500">
          {recipient ? 'Proof for the selected recipient' : 'Sample proof — example recipient details'}. Includes every printed side; pick a recipient to personalize.
        </p>
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-lg bg-card p-3">
            <RecipientPicker onSelect={selectRecipient} />
            {recipient && <Button type="button" variant="ghost" size="sm" onClick={()=>selectRecipient(null)}>Use example details</Button>}
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
                  <div className="flex h-full flex-col gap-2"><label className="text-xs">3D sheet<select aria-label="3D sheet" value={getDesignSpread(doc,selectedPage).front?.id ?? 'front'} className="ml-2 rounded border bg-background p-1" onChange={event=>setSelectedPage(event.target.value as typeof selectedPage)}>{getPrintedPages(doc).filter(page=>page.side==='front').map(page=><option key={page.id} value={page.id}>Sheet {page.sheetIndex+1}</option>)}</select></label><Design3DPreview documentState={documentState} recipient={recipient} selectedPage={selectedPage} values={values} /></div>
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
                  {result.widthIn.toFixed(2)}″ × {result.heightIn.toFixed(2)}″ @ {result.dpi} DPI · {result.pageCount} printed {result.pageCount===1?'side':'sides'} · RGB
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
