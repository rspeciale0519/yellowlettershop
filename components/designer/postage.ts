import type { CanvasSize, DesignElement } from "@/types/designer"

export type PostageKind = "stamp" | "indicia"

export interface PostageDefault {
  label: string
  width: number
  height: number
}

// Approximate footprints in the design space (inches × DESIGN_PPI=100).
// Stamp ≈ 0.96×1.08in; indicia permit imprint ≈ 1.5×0.75in. Documented
// approximations isolated here; ops validates against the USPS DMM before print.
export const POSTAGE_DEFAULTS: Record<PostageKind, PostageDefault> = {
  stamp: { label: "STAMP", width: 96, height: 108 },
  indicia: { label: "INDICIA", width: 150, height: 75 },
}

export const POSTAGE_KINDS: PostageKind[] = ["stamp", "indicia"]

type Box = Pick<DesignElement, "x" | "y" | "width" | "height">

/** Pure: do two axis-aligned boxes overlap with positive area? (edge-touch = false) */
export function rectsOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/** True for stamp/indicia postage elements. */
export function isPostageType(type: string): boolean {
  return type === "postage"
}

/**
 * Singleton + mutual exclusion: a mailpiece uses stamp OR indicia, at most one
 * total. Returns the kinds that may still be ADDED given current elements.
 */
export function availablePostageKinds(elements: { type: string }[]): PostageKind[] {
  return elements.some((e) => isPostageType(e.type)) ? [] : [...POSTAGE_KINDS]
}

/** Default placement for a new postage element: top-right, inside a small margin. */
export function defaultPostagePosition(kind: PostageKind, canvas: CanvasSize): { x: number; y: number } {
  const d = POSTAGE_DEFAULTS[kind]
  const margin = 24
  return { x: Math.max(margin, canvas.width - margin - d.width), y: margin }
}
