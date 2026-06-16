import type { CanvasSize, DesignElement } from "@/types/designer"

export type AlignDirection = "left" | "center" | "right" | "top" | "middle" | "bottom"

type Box = Pick<DesignElement, "x" | "y" | "width" | "height">

/**
 * Pure: the position delta to align a box to the page (canvas).
 * Horizontal directions return `{ x }`, vertical directions return `{ y }`.
 * Multi-element distribute is intentionally not handled here — the designer's
 * selection model is single-element, so alignment is always element-vs-page.
 */
export function alignToPage(
  box: Box,
  canvas: CanvasSize,
  dir: AlignDirection,
): Partial<Pick<DesignElement, "x" | "y">> {
  switch (dir) {
    case "left":
      return { x: 0 }
    case "center":
      return { x: Math.round(canvas.width / 2 - box.width / 2) }
    case "right":
      return { x: canvas.width - box.width }
    case "top":
      return { y: 0 }
    case "middle":
      return { y: Math.round(canvas.height / 2 - box.height / 2) }
    case "bottom":
      return { y: canvas.height - box.height }
  }
}
