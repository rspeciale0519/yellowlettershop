// Rotation math for the PDF renderer, kept pure + isolated so it can be unit
// tested without pdf-lib. Element rotation in the designer is a CSS
// `transform: rotate(Ndeg)` about the element's CENTER (transform-origin
// 50% 50%) — clockwise in screen space (y grows downward). The PDF page is
// y-UP, so the same visual rotation is the NEGATED mathematical angle, and
// pdf-lib rotates a primitive about its own draw anchor (a corner / baseline),
// not the box center. To reproduce center-rotation we therefore rotate each
// draw anchor about the box center by the same angle we hand pdf-lib's
// `rotate` option, so the primitive's body pivots around the center.

export interface Pt {
  x: number
  y: number
}

/**
 * The pdf-lib rotation angle (degrees, CCW-positive in y-up space) that
 * reproduces a designer element's CSS rotation (degrees, CW in screen space).
 * Returns 0 for undefined/0 so unrotated elements render byte-identically.
 */
export function pdfAngleFromCss(cssDeg: number | undefined): number {
  // `cssDeg ? ... : 0` also normalises -0 → 0 so callers' truthiness guards and
  // strict equality behave predictably.
  return cssDeg ? -cssDeg : 0
}

/**
 * Rotate point `p` about center `c` by `angleDeg` (same CCW-positive, y-up
 * convention pdf-lib uses). Identity when angleDeg is 0 so the common
 * unrotated path is untouched.
 */
export function rotateAbout(p: Pt, c: Pt, angleDeg: number): Pt {
  if (!angleDeg) return p
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - c.x
  const dy = p.y - c.y
  return {
    x: c.x + dx * cos - dy * sin,
    y: c.y + dx * sin + dy * cos,
  }
}
