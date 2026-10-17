import { templatesData } from '@/data/templates-data'
import { createDesignerDocument, DESIGN_TEMPLATES, DESIGNER_STORAGE_KEY } from '@/components/designer/designer-templates'
import type { DesignElement, DesignerDocument, DesignerOrientation } from '@/types/designer'
import type { MailFormatId } from '@/components/designer/mail-spec'

export type TemplateEntry = { catalogId: string } & (
  | { readiness: 'ready'; designerTemplateId: string; formatId: MailFormatId; orientation: DesignerOrientation }
  | { readiness: 'preview-only'; designerTemplateId: null; formatId: null; orientation: null }
)

export function resolveTemplateEntry(templateId: string): TemplateEntry | null {
  const template = templatesData.templates.find((item) => item.id === templateId ||
    (item.editor.readiness === 'ready' && item.editor.designerTemplateId === templateId))
  if (!template) return null
  const { editor } = template
  if (editor.readiness !== 'ready' || !DESIGN_TEMPLATES.some((item) => item.id === editor.designerTemplateId)) {
    return { catalogId: template.id, readiness: 'preview-only', designerTemplateId: null, formatId: null, orientation: null }
  }
  return { catalogId: template.id, ...editor }
}

type TemplateBootstrap =
  | { status: 'ready'; document: DesignerDocument; recovered: boolean }
  | { status: 'unavailable'; reason: 'unknown' | 'preview-only' }

/** Explicit selection wins over an unrelated draft; matching edits survive reload. */
export function bootstrapTemplateDocument(requestedId: string | null, recovered: DesignerDocument | null): TemplateBootstrap {
  if (requestedId === null) return { status: 'ready', document: recovered ?? createDesignerDocument(), recovered: Boolean(recovered) }
  const entry = resolveTemplateEntry(requestedId)
  if (!entry) return { status: 'unavailable', reason: 'unknown' }
  if (entry.readiness !== 'ready') return { status: 'unavailable', reason: 'preview-only' }
  if (recovered?.templateId === entry.designerTemplateId) return { status: 'ready', document: recovered, recovered: true }
  return { status: 'ready', document: { ...createDesignerDocument(entry.designerTemplateId), formatId: entry.formatId, orientation: entry.orientation }, recovered: false }
}

/** Keep only the existing order context; auth/query state is not forwarded. */
export function templateContextParams(context: string): URLSearchParams {
  const source = new URLSearchParams(context)
  const params = new URLSearchParams()
  for (const key of ['orderId', 'source']) {
    const value = source.get(key)
    if (value) params.set(key, value)
  }
  return params
}
export function templateEntryUrl(templateId: string, context = ''): string {
  const params = new URLSearchParams({ templateId })
  for (const [key, value] of templateContextParams(context)) params.set(key, value)
  return `/design/customize?${params}`
}
export function templateContextUrl(path: string, context: string): string {
  const params = templateContextParams(context).toString()
  return params ? `${path}?${params}` : path
}

// Existing local recovery behavior, centralized with template bootstrap.
export function loadStoredDesignerState(): { document: DesignerDocument } | null {
  try {
    const raw = window.localStorage.getItem(DESIGNER_STORAGE_KEY)
    return raw ? JSON.parse(raw) as { document: DesignerDocument } : null
  } catch {
    return null
  }
}
export function normalizeElements(elements: DesignElement[]): DesignElement[] {
  return elements.map((element, index) => ({ ...element, name: element.name || `${element.type} ${index + 1}`, zIndex: element.zIndex || index + 1 }))
}

export function designerAuthenticationUrl(context: string): string {
  const params = new URLSearchParams(context)
  const requestedId = params.get('templateId')
  const destination = requestedId === null ? templateContextUrl('/design/customize', context) : templateEntryUrl(requestedId, context)
  return `/?auth=login&redirectedFrom=${encodeURIComponent(destination)}`
}
