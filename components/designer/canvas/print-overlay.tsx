import type { RectPx, SpecRects } from "@/components/designer/mail-spec"

// Non-printing guide overlay. Lives inside the (zoom-scaled) artboard, in the
// same design-px space as elements. NEVER persisted to the document and NEVER
// sent to the renderer (the server recomputes zones from formatId).
function box(rect: RectPx, className: string, label?: string) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      {label ? (
        <span className="absolute left-1 top-1 bg-black/55 px-1 text-[9px] font-semibold uppercase tracking-wide text-white">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export function PrintOverlay({ specRects }: { specRects?: SpecRects }) {
  if (!specRects) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-40" aria-hidden="true" data-print-overlay>
      {box(specRects.bleed, "border border-dashed border-red-500/70")}
      {box(specRects.trim, "border border-gray-400")}
      {box(specRects.safe, "border border-dashed border-emerald-500/70")}
      {box(specRects.address, "border border-blue-500/70 bg-blue-500/5", "Address")}
      {box(specRects.indicia, "border border-amber-500/70 bg-amber-500/5", "Indicia")}
    </div>
  )
}
