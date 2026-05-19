import type { CanvasSize, DesignElement } from "@/types/designer"

export interface SnapGuide {
  axis: "x" | "y"
  position: number
}

// Pure snap math, extracted verbatim from canvas-area (Phase 2, no behavior
// change). Phase 5 will additionally surface the active guide lines.
export function snapPosition(
  element: DesignElement,
  x: number,
  y: number,
  elements: DesignElement[],
  canvasSize: CanvasSize,
) {
  const threshold = 8
  const guides = [32, canvasSize.width / 2, canvasSize.width - 32]
  const verticalGuides = [32, canvasSize.height / 2, canvasSize.height - 32]
  elements.forEach((item) => {
    if (item.id !== element.id && !item.hidden) {
      guides.push(item.x, item.x + item.width / 2, item.x + item.width)
      verticalGuides.push(item.y, item.y + item.height / 2, item.y + item.height)
    }
  })
  const candidatesX = [x, x + element.width / 2, x + element.width]
  const candidatesY = [y, y + element.height / 2, y + element.height]
  const snapX = guides.flatMap((guide) => candidatesX.map((candidate, index) => ({ guide, index, diff: Math.abs(guide - candidate) }))).sort((a, b) => a.diff - b.diff)[0]
  const snapY = verticalGuides.flatMap((guide) => candidatesY.map((candidate, index) => ({ guide, index, diff: Math.abs(guide - candidate) }))).sort((a, b) => a.diff - b.diff)[0]
  return {
    x: snapX?.diff <= threshold ? snapX.guide - (snapX.index === 1 ? element.width / 2 : snapX.index === 2 ? element.width : 0) : x,
    y: snapY?.diff <= threshold ? snapY.guide - (snapY.index === 1 ? element.height / 2 : snapY.index === 2 ? element.height : 0) : y,
  }
}
