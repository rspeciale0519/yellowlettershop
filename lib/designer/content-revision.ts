import { normalizeDesignerDocument } from './document/normalize'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonicalize(item)]),
  )
  return value
}

/** Metadata assigned on save must not invalidate the artwork revision. */
export function canonicalDocumentContent(input: unknown): string {
  const document = { ...normalizeDesignerDocument(input) }
  delete document.designId
  // updatedAt is intentionally excluded; edits are identified by their content.
  return JSON.stringify(canonicalize({ ...document, updatedAt: undefined }))
}

export async function documentRevision(input: unknown): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalDocumentContent(input)))
  return `sha256:${Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')}`
}
