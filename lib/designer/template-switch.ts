import { createDesignerDocument } from '../../components/designer/designer-templates'
import type { DesignerDocument } from '../../types/designer'
import { normalizeDesignerDocument } from './document/normalize'
export function compatiblePaperSwitch(current: string, next: string) {
  const notepad = (id: string) => id === 'white-notepad' || id === 'yellow-notepad'
  return notepad(current) && notepad(next)
}
/** A paper-color change retains the whole composition; unrelated layouts start fresh. */
export function switchDesignerTemplate(input: DesignerDocument, templateId: string) {
  const next = normalizeDesignerDocument(createDesignerDocument(templateId))
  if (!compatiblePaperSwitch(input.templateId,templateId)) return next
  const source=normalizeDesignerDocument(input)
  return normalizeDesignerDocument({...source,designId:undefined,templateId,templateName:next.templateName,
    pageSettings:Object.fromEntries(source.pageOrder.map(id=>[id,{...source.pageSettings[id],paper:source.pageSettings[id].paper===source.templateId?templateId:source.pageSettings[id].paper}])),
    updatedAt:new Date().toISOString(),
  })
}
