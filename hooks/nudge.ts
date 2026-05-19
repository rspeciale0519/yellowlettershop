// Pure arrow-key nudge delta (unit-tested). Shift = coarse 10px step.
const ARROWS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
}

export function nudgeDelta(key: string, shift: boolean): { dx: number; dy: number } | null {
  const dir = ARROWS[key]
  if (!dir) return null
  const step = shift ? 10 : 1
  return { dx: dir.x * step, dy: dir.y * step }
}
