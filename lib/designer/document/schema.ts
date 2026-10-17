import { z } from 'zod'

const finite = z.number().finite()
const element = z.object({
  id: z.string().min(1), type: z.enum(['text', 'image', 'graphic', 'qr', 'table', 'postage']),
  x: finite, y: finite, width: finite.nonnegative(), height: finite.nonnegative(), zIndex: finite,
}).passthrough().superRefine((value, ctx) => {
  const required: Record<string, string[]> = { text: ['content'], image: ['src'], graphic: ['shape', 'fill'], qr: ['value', 'foreground', 'background'], postage: ['kind'] }
  for (const key of required[value.type] ?? []) {
    if (typeof value[key] !== 'string') ctx.addIssue({ code: 'custom', message: `Missing ${value.type} ${key}` })
  }
  if (value.type === 'text' && (typeof value.fontSize !== 'number' || !Number.isFinite(value.fontSize) || value.fontSize <= 0)) ctx.addIssue({ code: 'custom', message: 'Invalid font size' })
  if (value.type === 'table' && (!Array.isArray(value.cells) || value.cells.some(row => !Array.isArray(row) || row.some(cell => typeof cell !== 'string')))) ctx.addIssue({ code: 'custom', message: 'Invalid table cells' })
})
const style = z.object({ fontSize: finite.positive().max(300), fontFamily: z.string().optional(), bold: z.boolean().optional(), italic: z.boolean().optional(), underline: z.boolean().optional(), color: z.string().optional(), letterSpacing: finite.optional() })
export const storySchema = z.object({
  id: z.string().min(1), style,
  paragraphs: z.array(z.object({ align: z.enum(['left', 'center', 'right']).optional(), runs: z.array(z.object({ text: z.string(), field: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).optional(), style: style.partial().optional() }).strict()) }).strict()).max(10000),
}).strict()
const region = z.object({ id: z.string(), x: finite, y: finite, width: finite.positive(), height: finite.positive(), firstBaseline: finite.optional(), lineSpacing: finite.positive().optional() })
const background = z.object({ color: z.string().optional(), image: z.object({ src: z.string(), fit: z.enum(['cover', 'contain']), assetId: z.string().optional(), sourceUrl: z.string().optional(), opacity: finite.min(0).max(1).optional() }).optional() })
export const documentSchema = z.object({
  version: z.literal(2).optional(), designId: z.string().optional(),
  templateId: z.string(), templateName: z.string(), orientation: z.enum(['portrait', 'landscape']),
  formatId: z.enum(['letter_8_5x11', 'postcard_4x6', 'postcard_6x9', 'postcard_6x11']).optional(),
  pages: z.record(z.string().regex(/^(front|back|page-[a-zA-Z0-9-]+)$/), z.array(element)),
  backgrounds: z.record(background).optional(), updatedAt: z.string(),
  pageOrder: z.array(z.string().regex(/^(front|back|page-[a-zA-Z0-9-]+)$/)).max(100).optional(),
  pageSettings: z.record(z.object({ printIncluded: z.boolean(), sheetIndex: z.number().int().nonnegative(), side: z.enum(['front', 'back']), paper: z.enum(['plain', 'white-notepad', 'yellow-notepad']), regions: z.array(region).max(100) })).optional(),
}).passthrough()
