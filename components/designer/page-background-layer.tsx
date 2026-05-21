import type { PageBackground } from "@/types/designer"

// Sits beneath all elements (and beneath the non-printing print overlay).
// Full-bleed by construction: absolute inset-0 fills the whole artboard (the
// artboard already extends into bleed in Phase 3). Returns null when unset —
// identical to pre-overhaul behavior (plain white paper).
export function PageBackgroundLayer({ background }: { background?: PageBackground }) {
  if (!background || (!background.color && !background.image)) return null
  const image = background.image
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {background.color ? (
        <div className="absolute inset-0" style={{ backgroundColor: background.color }} />
      ) : null}
      {image && !image.src.startsWith("placeholder:") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.src}
          alt=""
          className={`absolute inset-0 h-full w-full ${
            image.fit === "contain" ? "object-contain" : "object-cover"
          }`}
          style={{ opacity: image.opacity ?? 1 }}
        />
      ) : null}
    </div>
  )
}
