import type { DesignerImageAsset } from "@/types/designer"

// One drag protocol for every module card AND every saved-image thumbnail.
export const DND_MIME = "application/x-yls-designer"
const LEGACY_MODULE_MIME = "application/x-yls-module"

export type DesignerDragPayload =
  | { kind: "module"; moduleId: string }
  | { kind: "asset"; asset: DesignerImageAsset }

export function setDragPayload(dt: DataTransfer, payload: DesignerDragPayload): void {
  dt.setData(DND_MIME, JSON.stringify(payload))
  dt.effectAllowed = "copy"
}

export function readDragPayload(dt: DataTransfer): DesignerDragPayload | null {
  const raw = dt.getData(DND_MIME)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DesignerDragPayload
      if (parsed && (parsed.kind === "module" || parsed.kind === "asset")) return parsed
    } catch {
      return null
    }
    return null
  }
  // Back-compat: pre-overhaul drag set a bare moduleId on a legacy mime.
  const legacy = dt.getData(LEGACY_MODULE_MIME)
  return legacy ? { kind: "module", moduleId: legacy } : null
}

/** Zoom/pan-correct cursor → canvas-space mapping (extracted verbatim). */
export function dropPointToCanvas(
  event: { clientX: number; clientY: number },
  rect: { left: number; top: number },
  pan: { x: number; y: number },
  canvasScale: number,
): { x: number; y: number } {
  return {
    x: (event.clientX - rect.left - pan.x) / canvasScale,
    y: (event.clientY - rect.top - pan.y) / canvasScale,
  }
}
