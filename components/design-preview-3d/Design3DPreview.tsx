"use client"

import { useCallback, useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { withFormatId } from "@/components/designer/mail-spec"
import { useDesignerFonts } from "@/hooks/use-designer-fonts"
import type { RecipientDTO } from "@/components/designer/preview/recipient-dto"
import type { DesignerDocument } from "@/types/designer"
import { LetterScene } from "./core/LetterScene"
import type { DesignArt } from "./core/art-textures"
import { CaptureStage } from "./capture-stage"
import { formatStock } from "./format-stocks"

export interface Design3DPreviewProps {
  documentState: DesignerDocument
  recipient: RecipientDTO | null
}

/**
 * The 3D proof: captures the user's front/back design (CaptureStage) and
 * shows it on the physically-real paper — drag to rotate, grab the page to
 * turn it, scroll to zoom. This module is the dynamic(ssr:false) boundary:
 * the three.js chunk loads only when the 3D tab is opened.
 */
export default function Design3DPreview({
  documentState,
  recipient,
}: Design3DPreviewProps) {
  const fonts = useDesignerFonts()
  const [art, setArt] = useState<DesignArt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [epoch, setEpoch] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const stock = useMemo(() => {
    const doc = withFormatId(documentState)
    return formatStock(doc.formatId, doc.orientation)
  }, [documentState])

  const handleCaptured = useCallback((captured: DesignArt) => {
    setError(null)
    setArt(captured)
  }, [])

  const handleError = useCallback((message: string) => {
    setError(message)
  }, [])

  const retry = useCallback(() => {
    setArt(null)
    setError(null)
    setEpoch((e) => e + 1)
  }, [])

  return (
    <div className="relative flex h-full w-full flex-col">
      <CaptureStage
        key={epoch}
        documentState={documentState}
        recipient={recipient}
        fonts={fonts}
        onCaptured={handleCaptured}
        onError={handleError}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-gradient-to-b from-white to-gray-100">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-gray-600">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : art ? (
          <Canvas shadows>
            <LetterScene
              stock={stock}
              flipped={flipped}
              onFlippedChange={setFlipped}
              art={art}
            />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing 3D proof…
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3">
        <span className="text-xs uppercase tracking-wide text-gray-500">
          Left-drag to rotate · right-drag (or 2 fingers) to pan · grab an edge to turn the page · scroll to zoom
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          disabled={!art}
        >
          {flipped ? "Show the front" : "Flip it over"}
        </Button>
      </div>
    </div>
  )
}
