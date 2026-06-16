// Shared inspector control styling (extracted from the original
// inspector-panel.tsx so every sub-panel/field stays visually consistent).
export const controlClass =
  "h-10 border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-yellow-400"
export const selectClass = `${controlClass} w-full rounded-md border px-3 text-sm`
export const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"

// Brand-aligned quick swatches (Tailwind `yellow` scale + neutrals).
export const BRAND_SWATCHES = [
  "#ffffff",
  "#fef9c3",
  "#fde047",
  "#facc15",
  "#eab308",
  "#ca8a04",
  "#6b7280",
  "#111827",
  "#000000",
]
