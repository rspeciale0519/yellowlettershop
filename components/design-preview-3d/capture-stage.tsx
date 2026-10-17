"use client"

import { useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { getDesignSpread } from "@/lib/designer/document/pages"
import { DesignerTextProvider } from "@/components/designer/writing/text-layout-context"
import { usePrintFonts } from "@/hooks/use-print-fonts"
import type { ResolvedValues } from "@/lib/designer/text/types"
import { withFormatId } from "@/components/designer/mail-spec"
import type { DesignerFont } from "@/components/designer/designer-fonts"
import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"
import type { DesignerDocument, DesignerPage } from "@/types/designer"
import { StaticPageRender } from "./static-page-render"
import { capturePageCanvas, waitForPaintable, withCaptureSafeImageSrcs } from "./capture-page"
import type { DesignArt } from "./core/art-textures"

export interface CaptureStageProps {
  documentState: DesignerDocument
  recipient: RecipientDTO | null
  selectedPage?: DesignerPage
  values?: ResolvedValues
  fonts: DesignerFont[]
  onCaptured: (art: DesignArt) => void
  onError: (message: string) => void
}

/**
 * Invisible worker component: mounts BOTH design pages (front and back) as
 * clean static renders in an off-screen container, waits until they are
 * paintable, rasterizes each to a canvas, and hands the pair up. Re-captures
 * whenever the document or the chosen recipient changes.
 *
 * Token substitution runs client-side with the pure token-engine — same
 * engine and same sender default ({}) as the server PDF route, so the 3D
 * face matches the printed proof.
 *
 * The container is position:fixed off-viewport (NEVER display:none — zero
 * layout would make every capture blank) and portaled to document.body so
 * dialog transforms/overflow can't clip or scale it.
 */
export function CaptureStage({
  documentState,
  selectedPage = "front",
  values,
  fonts,
  onCaptured,
  onError,
}: CaptureStageProps) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const { metrics } = usePrintFonts()
  const prepared = useMemo(() => ({ ...withFormatId(documentState), pages: Object.fromEntries(Object.entries(documentState.pages).map(([id, elements]) => [id, withCaptureSafeImageSrcs(elements)])) as DesignerDocument["pages"] }), [documentState])
  const spread = useMemo(() => getDesignSpread(prepared, selectedPage), [prepared, selectedPage])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const frontNode = frontRef.current
      const backNode = backRef.current
      if (!frontNode || !backNode || !metrics) return
      try {
        await Promise.all([waitForPaintable(frontNode), waitForPaintable(backNode)])
        if (cancelled) return
        const [front, back] = await Promise.all([
          capturePageCanvas(frontNode),
          capturePageCanvas(backNode),
        ])
        if (cancelled) return
        onCaptured({ front, back })
      } catch (e) {
        if (!cancelled) onError(e instanceof Error ? e.message : "Could not capture the design")
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [prepared, spread, values, metrics, fonts, onCaptured, onError])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      aria-hidden="true"
      style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", colorScheme: "light" }}
    >
      <div ref={frontRef}>
        <DesignerTextProvider document={prepared} pageId={spread.front?.id ?? "front"} values={values}><StaticPageRender
          elements={spread.front?.elements ?? []}
          background={spread.front?.background}
          formatId={prepared.formatId}
          orientation={prepared.orientation}
          fonts={fonts}
        /></DesignerTextProvider>
      </div>
      <div ref={backRef}>
        <DesignerTextProvider document={prepared} pageId={spread.back?.id ?? "back"} values={values}><StaticPageRender
          elements={spread.back?.elements ?? []}
          background={spread.back?.background}
          formatId={prepared.formatId}
          orientation={prepared.orientation}
          fonts={fonts}
        /></DesignerTextProvider>
      </div>
    </div>,
    document.body,
  )
}
