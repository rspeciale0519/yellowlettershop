"use client"

import { PageBackgroundLayer } from "@/components/designer/page-background-layer"
import { RenderElement } from "@/components/designer/canvas/render-element"
import { isPostageType } from "@/components/designer/postage"
import { canvasSizePx } from "@/components/designer/mail-spec"
import type { MailFormatId, MailOrientation } from "@/components/designer/mail-spec"
import type { DesignerFont } from "@/components/designer/designer-fonts"
import type { DesignElement, PageBackground } from "@/types/designer"
import { elementFrameStyle } from "./element-frame"

const noop = () => {}

export interface StaticPageRenderProps {
  elements: DesignElement[]
  background?: PageBackground
  formatId: MailFormatId
  orientation: MailOrientation
  fonts: DesignerFont[]
}

// A clean, non-interactive render of one designer page at scale 1 — the same
// RenderElement / PageBackgroundLayer the editor uses, minus react-rnd,
// selection borders, guides and the print overlay. This is what gets
// rasterized (html-to-image) into the 3D paper's face texture, so anything
// the editor can draw is reproduced by construction.
export function StaticPageRender({
  elements,
  background,
  formatId,
  orientation,
  fonts,
}: StaticPageRenderProps) {
  const size = canvasSizePx(formatId, orientation)
  return (
    <div
      className="relative bg-white text-gray-950"
      style={{ width: size.width, height: size.height }}
    >
      <PageBackgroundLayer background={background} />
      {elements
        // Postage boxes are non-printing keep-clear placeholders — the PDF
        // renderer omits them, so the 3D piece (the finished artifact) does too.
        .filter((element) => !element.hidden && !isPostageType(element.type))
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => (
          <div key={element.id} style={elementFrameStyle(element)}>
            <RenderElement
              element={element}
              fonts={fonts}
              editing={false}
              onEdit={noop}
              onUpdate={noop}
            />
          </div>
        ))}
    </div>
  )
}
