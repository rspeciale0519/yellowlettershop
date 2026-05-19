import type { CanvasSize, DesignElement } from "@/types/designer"

export interface SnapGuide {
  axis: "x" | "y"
  position: number
}

// Pure snap math. `computeSnap` also emits the active guide lines so the
// canvas can render them live during drag (Phase 7). `snapPosition` keeps its
// original {x,y} contract (used by onDragStop) and delegates here.
export function computeSnap(
  element: DesignElement,
  x: number,
  y: number,
  elements: DesignElement[],
  canvasSize: CanvasSize,
): { x: number; y: number; guides: SnapGuide[] } {
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
  const activeGuides: SnapGuide[] = []
  const snappedX = snapX?.diff <= threshold
  const snappedY = snapY?.diff <= threshold
  if (snappedX) activeGuides.push({ axis: "x", position: snapX.guide })
  if (snappedY) activeGuides.push({ axis: "y", position: snapY.guide })
  return {
    x: snappedX ? snapX.guide - (snapX.index === 1 ? element.width / 2 : snapX.index === 2 ? element.width : 0) : x,
    y: snappedY ? snapY.guide - (snapY.index === 1 ? element.height / 2 : snapY.index === 2 ? element.height : 0) : y,
    guides: activeGuides,
  }
}

export function snapPosition(
  element: DesignElement,
  x: number,
  y: number,
  elements: DesignElement[],
  canvasSize: CanvasSize,
) {
  const { x: nx, y: ny } = computeSnap(element, x, y, elements, canvasSize)
  return { x: nx, y: ny }
}
