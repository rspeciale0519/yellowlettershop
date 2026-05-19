import type { RectPx, SpecRects } from "@/components/designer/mail-spec"
import { TOKEN_RE, resolveFieldKey } from "@/components/designer/tokens/token-engine"
import type { DesignElement } from "@/types/designer"

export type PreflightSeverity = "error" | "warning"

export interface PreflightIssue {
  elementId?: string
  label: string
  message: string
  severity: PreflightSeverity
  rule: string
}

export interface PreflightContext {
  specRects?: SpecRects
  naturalSizes?: Record<string, { w: number; h: number }>
  knownTokens?: Set<string>
}

// Canonical tokens the renderer can resolve (matches recipient-map).
const DEFAULT_KNOWN = new Set([
  "first_name", "last_name", "full_name", "address_line_1", "address_line_2",
  "mailing_address", "property_address", "city", "state", "zip_code",
  "company", "email", "phone", "sender_first", "sender_last",
  "sender_phone", "sender_company", "sender_email",
])

const PRINT_SCALE = 3 // 300 DPI / DESIGN_PPI(100)

function box(el: DesignElement): RectPx {
  return { x: el.x, y: el.y, w: el.width, h: el.height }
}
function inside(inner: RectPx, outer: RectPx): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  )
}
function overlaps(a: RectPx, b: RectPx): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function runPreflight(elements: DesignElement[], ctx: PreflightContext): PreflightIssue[] {
  const issues: PreflightIssue[] = []
  const known = ctx.knownTokens ?? DEFAULT_KNOWN

  for (const el of elements) {
    if (el.hidden) continue
    const label = el.name || el.type
    const add = (severity: PreflightSeverity, rule: string, message: string) =>
      issues.push({ elementId: el.id, label, message, severity, rule })

    if (el.type === "image" && el.src.startsWith("placeholder:")) {
      add("warning", "placeholder", `${label} still uses a placeholder image.`)
    }
    if (el.type === "text" && !el.content.trim()) {
      add("warning", "empty-text", `${label} has no text.`)
    }
    if (el.type === "text") {
      if (el.fontSize < 6) add("error", "tiny-font", `${label} font is too small to print.`)
      else if (el.fontSize < 8) add("warning", "tiny-font", `${label} font may be too small to print.`)
      for (const m of el.content.matchAll(TOKEN_RE)) {
        if (!known.has(resolveFieldKey(m[1]))) {
          add("warning", "unknown-token", `Unknown personalization field {{${m[1]}}}.`)
        }
      }
    }
    if (
      el.type === "image" &&
      !el.src.startsWith("placeholder:") &&
      ctx.naturalSizes?.[el.id]
    ) {
      const nat = ctx.naturalSizes[el.id]
      const reqW = el.width * PRINT_SCALE
      const reqH = el.height * PRINT_SCALE
      if (nat.w < 0.66 * reqW || nat.h < 0.66 * reqH) {
        add("error", "low-dpi", `${label} is too low-resolution for print (needs ~300 DPI at this size).`)
      }
    }
    if (ctx.specRects) {
      const r = box(el)
      if (!inside(r, ctx.specRects.safe)) {
        add("warning", "out-of-safe", `${label} is outside the safe area and may be trimmed.`)
      }
      if (overlaps(r, ctx.specRects.address) || overlaps(r, ctx.specRects.indicia)) {
        add("error", "clear-zone", `${label} overlaps the USPS address/indicia clear zone.`)
      }
    }
  }
  return issues
}
