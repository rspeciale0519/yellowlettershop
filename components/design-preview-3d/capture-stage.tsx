"use client"

import { useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { substituteDocument } from "@/components/designer/tokens/token-engine"
import { buildTokenContext } from "@/components/designer/tokens/recipient-map"
import { withFormatId } from "@/components/designer/mail-spec"
import type { DesignerFont } from "@/components/designer/designer-fonts"
import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"
import type { DesignerDocument } from "@/types/designer"
import { StaticPageRender } from "./static-page-render"
import { capturePageCanvas, waitForPaintable, withCaptureSafeImageSrcs } from "./capture-page"
import type { DesignArt } from "./core/art-textures"

export interface CaptureStageProps {
  documentState: DesignerDocument
  recipient: RecipientDTO | null
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
  recipient,
  fonts,
  onCaptured,
  onError,
}: CaptureStageProps) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const prepared = useMemo(() => {
    const substituted = recipient
      ? substituteDocument(documentState, buildTokenContext(recipient, {}))
      : documentState
    const withFormat = withFormatId(substituted)
    return {
      ...withFormat,
      pages: {
        front: withCaptureSafeImageSrcs(withFormat.pages.front),
        back: withCaptureSafeImageSrcs(withFormat.pages.back),
      },
    }
  }, [documentState, recipient])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const frontNode = frontRef.current
      const backNode = backRef.current
      if (!frontNode || !backNode) return
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
  }, [prepared, fonts, onCaptured, onError])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      aria-hidden="true"
      style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", colorScheme: "light" }}
    >
      <div ref={frontRef}>
        <StaticPageRender
          elements={prepared.pages.front}
          background={prepared.backgrounds?.front}
          formatId={prepared.formatId}
          orientation={prepared.orientation}
          fonts={fonts}
        />
      </div>
      <div ref={backRef}>
        <StaticPageRender
          elements={prepared.pages.back}
          background={prepared.backgrounds?.back}
          formatId={prepared.formatId}
          orientation={prepared.orientation}
          fonts={fonts}
        />
      </div>
    </div>,
    document.body,
  )
}
