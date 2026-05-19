import type { DesignerDocument, DesignElement } from "@/types/designer"
import type { TokenContext } from "@/components/designer/tokens/recipient-map"

export const TOKEN_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g

// Reconciles the merge-field catalog vs. the tokens templates actually use
// (e.g. {{mailing_address}} ↔ {{address_line_1}}) without rewriting templates.
export const FIELD_ALIASES: Record<string, string> = {
  mailing_address: "address_line_1",
}

export function resolveFieldKey(raw: string): string {
  return FIELD_ALIASES[raw] ?? raw
}

export function extractTokens(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(TOKEN_RE)) found.add(match[1])
  return Array.from(found)
}

export function substitute(
  text: string,
  ctx: TokenContext,
  opts?: { keepUnknown?: boolean },
): string {
  return text.replace(TOKEN_RE, (whole, rawKey: string) => {
    const key = resolveFieldKey(rawKey)
    if (key in ctx.values) return ctx.values[key]
    if (resolveFieldKey(rawKey) !== rawKey && rawKey in ctx.values) return ctx.values[rawKey]
    return opts?.keepUnknown ? whole : ""
  })
}

function substituteElement(element: DesignElement, ctx: TokenContext, opts?: { keepUnknown?: boolean }): DesignElement {
  if (element.type === "text") {
    return { ...element, content: substitute(element.content, ctx, opts) }
  }
  if (element.type === "qr") {
    return { ...element, value: substitute(element.value, ctx, opts) }
  }
  if (element.type === "table") {
    return { ...element, cells: element.cells.map((row) => row.map((cell) => substitute(cell, ctx, opts))) }
  }
  return { ...element }
}

/** Deep-cloned doc with every token resolved (original untouched). */
export function substituteDocument(
  doc: DesignerDocument,
  ctx: TokenContext,
  opts?: { keepUnknown?: boolean },
): DesignerDocument {
  return {
    ...doc,
    pages: {
      front: doc.pages.front.map((el) => substituteElement(el, ctx, opts)),
      back: doc.pages.back.map((el) => substituteElement(el, ctx, opts)),
    },
  }
}
