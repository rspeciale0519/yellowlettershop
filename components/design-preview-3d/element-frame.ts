import type { CSSProperties } from "react"
import type { DesignElement } from "@/types/designer"

// Absolute frame for one design element inside a page artboard — the static
// (non-interactive) equivalent of the react-rnd wrapper in
// components/designer/canvas/canvas-area.tsx.
//
// Deliberately NO rotation: canvas-area passes `rotate()` in the Rnd style,
// but react-draggable overwrites `transform` with its own translate, so the
// editor never actually renders rotation — and the server PDF renderer
// ignores element rotation too. The 3D capture must match what the editor
// shows and print produces today. (Rotation being a phantom in both places
// is a pre-existing gap, tracked separately.)
export function elementFrameStyle(element: DesignElement): CSSProperties {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    opacity: element.opacity ?? 1,
  }
}
