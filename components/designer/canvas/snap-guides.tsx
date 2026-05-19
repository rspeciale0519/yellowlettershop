import type { SnapGuide } from "@/components/designer/canvas/snap"

// Presentational only. Phase 7 feeds live guides from the drag handler; until
// then it renders nothing (empty guide list) — no behavior change yet.
export function SnapGuides({ guides }: { guides: SnapGuide[] }) {
  if (guides.length === 0) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {guides.map((guide, index) =>
        guide.axis === "x" ? (
          <div
            key={`x-${index}-${guide.position}`}
            className="absolute top-0 h-full w-px bg-yellow-500/80"
            style={{ left: guide.position }}
          />
        ) : (
          <div
            key={`y-${index}-${guide.position}`}
            className="absolute left-0 h-px w-full bg-yellow-500/80"
            style={{ top: guide.position }}
          />
        ),
      )}
    </div>
  )
}
