/** Fit both artboard dimensions into a padded viewport, returning percent. */
export function fitCanvas(
  viewport: { width: number; height: number },
  artboard: { width: number; height: number },
  padding: number,
): number {
  const dimensions = [viewport.width, viewport.height, artboard.width, artboard.height, padding]
  if (dimensions.some((value) => !Number.isFinite(value)) || artboard.width <= 0 || artboard.height <= 0) return 1
  const inset = Math.max(0, padding) * 2
  return Math.max(1, Math.min(100, Math.floor(Math.min(
    (viewport.width - inset) / artboard.width,
    (viewport.height - inset) / artboard.height,
  ) * 100)))
}
