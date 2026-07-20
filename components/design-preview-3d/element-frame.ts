import type { CSSProperties } from "react"
import type { DesignElement } from "@/types/designer"

// Absolute frame for one design element inside a page artboard — the static
// (non-interactive) equivalent of the react-rnd wrapper in
// components/designer/canvas/canvas-area.tsx.
//
// Rotation is applied here (CSS rotate about the element center, matching the
// editor's inner content wrapper and the PDF renderer's center-rotation) so
// the captured 3D face reproduces what the editor shows and print produces.
// (Transform-origin defaults to 50% 50%, i.e. the element center.)
export function elementFrameStyle(element: DesignElement): CSSProperties {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    opacity: element.opacity ?? 1,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  }
}
