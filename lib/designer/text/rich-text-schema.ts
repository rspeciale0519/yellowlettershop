import { z } from 'zod'
import { storySchema } from '../document/schema'
import type { RichTextStory, StoryRun, TextStyle } from '../../../types/designer-document'
const node = z.object({ type: z.string(), text: z.string().optional(), attrs: z.record(z.unknown()).optional(), marks: z.array(z.object({ type: z.string() }).passthrough()).optional(), content: z.array(z.unknown()).optional() }).passthrough()
export function fromEditorDocument(input: unknown, id: string, style: TextStyle): RichTextStory {
  const root = node.parse(input)
  if (root.type !== 'doc') throw new Error('Unsupported text document')
  const paragraphs = (root.content ?? []).flatMap(raw => {
    const paragraph = node.parse(raw)
    if (paragraph.type !== 'paragraph') return []
    const runs: StoryRun[] = (paragraph.content ?? []).flatMap<StoryRun>(child => {
      const item = node.parse(child)
      if (item.type === 'hardBreak') return [{ text: '\n' }]
      if (item.type === 'personalization') {
        const field = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).parse(item.attrs?.field)
        return [{ text: '', field }]
      }
      if (item.type !== 'text') return []
      const supported: Partial<TextStyle> = {}
      for (const mark of item.marks ?? []) {
        if (mark.type === 'bold') supported.bold = true
        if (mark.type === 'italic') supported.italic = true
        if (mark.type === 'underline') supported.underline = true
      }
      return [{ text: item.text ?? '', ...(Object.keys(supported).length ? { style: supported } : {}) }]
    })
    const align = paragraph.attrs?.textAlign
    return [{ runs, ...(align === 'left' || align === 'center' || align === 'right' ? { align } : {}) }]
  })
  return storySchema.parse({ id, style, paragraphs })
}
export function toEditorDocument(story: RichTextStory): Record<string, unknown> {
  return { type:'doc', content: story.paragraphs.map(paragraph => ({ type:'paragraph', ...(paragraph.align ? { attrs:{textAlign:paragraph.align} } : {}), content: paragraph.runs.flatMap(run => {
    if (run.field) return [{ type:'personalization',attrs:{field:run.field} }]
    const marks = Object.entries(run.style ?? {}).flatMap(([key,value]) => value === true && ['bold','italic','underline'].includes(key) ? [{type:key}] : [])
    return run.text.split('\n').flatMap((text,index) => [...(index ? [{type:'hardBreak'}] : []),...(text ? [{type:'text',text,...(marks.length ? {marks} : {})}] : [])])
  }) })) }
}
export function storyText(story: RichTextStory): string { return story.paragraphs.map(paragraph => paragraph.runs.map(run => run.field ? `{{${run.field}}}` : run.text).join('')).join('\n') }
