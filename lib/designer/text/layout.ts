import type { DesignerDocument, DesignerPage, TextDesignElement } from '../../../types/designer'
import type { RichTextStory, TextStyle } from '../../../types/designer-document'
import { normalizeDesignerDocument } from '../document/normalize'
import { canvasSizePx } from '../../../components/designer/mail-spec'
import { paperGeometry } from './paper'
import { resolveText } from './resolve-values'
import type { BoxLayout, DocumentLayout, FontMetrics, PositionedRun, ResolvedValues } from './types'

interface Atom { text: string; style: TextStyle }
interface Region { key: string; pageId: DesignerPage; element: TextDesignElement; x: number; y: number; width: number; height: number; firstBaseline?: number; spacing?: number }
export function elementStory(element: TextDesignElement): RichTextStory {
  const style: TextStyle = { fontSize: element.fontSize, fontFamily: element.fontFamily, bold: element.fontWeight === 'bold' || Number(element.fontWeight) >= 600, italic: element.fontStyle === 'italic', underline: element.textDecoration === 'underline', color: element.color ?? '#111827', letterSpacing: element.letterSpacing ?? 0 }
  return element.richText ? { ...element.richText, style: { ...element.richText.style, ...style } } : { id: element.id, style, paragraphs: element.content.split('\n').map(text => ({ runs: [{ text }], align: element.textAlign })) }
}
function atomsFor(story: RichTextStory, paragraph: RichTextStory['paragraphs'][number], values: ResolvedValues): Atom[] {
  return paragraph.runs.flatMap(run => {
    const text = run.field ? values[run.field] ?? `{{${run.field}}}` : resolveText(run.text, values)
    const parts = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)
    return Array.from(parts, part => ({ text: part.segment, style: { ...story.style, ...run.style } }))
  })
}
function styledRuns(atoms: Atom[], metrics: FontMetrics): { text: string; style: TextStyle; width: number }[] {
  const groups: { text: string; style: TextStyle; width: number }[] = []
  for (const atom of atoms) {
    const previous = groups[groups.length - 1]
    if (previous && JSON.stringify(previous.style) === JSON.stringify(atom.style)) previous.text += atom.text
    else groups.push({ text: atom.text, style: atom.style, width: 0 })
  }
  return groups.map(group => ({ ...group, width: metrics.measure(group.text, group.style) }))
}
function lineWidth(atoms: Atom[], metrics: FontMetrics): number { return styledRuns(atoms, metrics).reduce((sum, run) => sum + run.width, 0) }
function words(atoms: Atom[]): Atom[][] {
  const chunks: Atom[][] = []
  for (const atom of atoms) {
    const last = chunks[chunks.length - 1]
    if (last && atom.text !== '\n' && last[0].text !== '\n' && /\s/.test(last[0].text) === /\s/.test(atom.text)) last.push(atom)
    else chunks.push([atom])
  }
  return chunks
}
function compose(story: RichTextStory, regions: Region[], values: ResolvedValues, metrics: FontMetrics, boxes: Record<string, BoxLayout>) {
  let index = 0
  let baseline: number | undefined
  let stopped = false
  const issue = (rule: 'overflow' | 'font', message: string) => {
    const region = regions[Math.min(index, regions.length - 1)]
    const box = boxes[region.key]
    if (!box.issues.some(item => item.rule === rule && item.message === message)) box.issues.push({ pageId: region.pageId, elementId: region.element.id, rule, message })
  }
  const place = (atoms: Atom[], align: 'left' | 'center' | 'right' = 'left'): boolean => {
    if (stopped) return false
    const measured=styledRuns(atoms,metrics)
    const ascent = Math.max(...(measured.length ? measured.map(run => metrics.ascent(run.style,run.text)) : [metrics.ascent(story.style)]))
    const fontSize = Math.max(...(measured.length ? measured.map(run=>run.style.fontSize) : [story.style.fontSize]))
    const descent = metrics.descent ? Math.max(0,...measured.map(run=>metrics.descent!(run.style,run.text))) : Math.max(2,fontSize-ascent)
    let region = regions[index]
    let step = region.spacing ?? fontSize * (region.element.lineHeight ?? 1.2)
    const start = () => region.firstBaseline === undefined ? region.y + ascent : region.firstBaseline + Math.max(0, Math.ceil((region.y + ascent - region.firstBaseline) / step)) * step
    baseline ??= start()
    while (baseline + descent > region.y + region.height) {
      index++
      if (index >= regions.length) { index = regions.length - 1; issue('overflow', 'Text does not fit. Shorten the message, resize its box, or add a supported page.'); stopped = true; return false }
      region = regions[index]
      step = region.spacing ?? fontSize * (region.element.lineHeight ?? 1.2)
      baseline = start()
    }
    if (region.spacing && fontSize > region.spacing) issue('font', 'This font is taller than the paper rules. Choose a smaller size to keep lines separate.')
    const groups = styledRuns(atoms, metrics)
    const width = groups.reduce((total, run) => total + run.width, 0)
    if (width > region.width + .01) issue('overflow', 'A character is wider than this writing area. Widen the box or use a smaller font.')
    let x = region.x + (align === 'right' ? region.width - width : align === 'center' ? (region.width - width) / 2 : 0)
    for (const group of groups) {
      if (!metrics.supports(group.text, group.style)) issue('font', 'A font or character cannot be printed. Choose a printable font or replace the highlighted text.')
      if (group.style.letterSpacing) {
        let prefix = ''
        const style = { ...group.style, letterSpacing: 0 }
        for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(group.text)) {
          const offset = metrics.measure(prefix, group.style) + (prefix ? group.style.letterSpacing : 0)
          boxes[region.key].runs.push({ text: segment, style, width: metrics.measure(segment, style), x: x + offset, baseline })
          prefix += segment
        }
      } else {
        const run: PositionedRun = { ...group, x, baseline }
        boxes[region.key].runs.push(run)
      }
      x += group.width
    }
    baseline += step
    return true
  }
  for (const paragraph of story.paragraphs) {
    let line: Atom[] = []
    for (const chunk of words(atomsFor(story, paragraph, values))) {
      if (chunk[0].text === '\n') { if (!place(line, paragraph.align)) return; line = []; continue }
      let region = regions[index]
      if (line.length && lineWidth([...line, ...chunk], metrics) > region.width) {
        while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop()
        if (!place(line, paragraph.align)) return
        line = []
        if (/^\s+$/.test(chunk[0].text)) continue
      }
      for (const atom of chunk) {
        region = regions[index]
        if (line.length && lineWidth([...line, atom], metrics) > region.width) { if (!place(line, paragraph.align)) return; line = [] }
        line.push(atom)
      }
    }
    if (!place(line, paragraph.align)) return
  }
}
export function layoutDesignerDocument(input: DesignerDocument, values: ResolvedValues, metrics: FontMetrics): DocumentLayout {
  const doc = normalizeDesignerDocument(input)
  const size = canvasSizePx(doc.formatId ?? 'letter_8_5x11', doc.orientation)
  const regions: Region[] = []
  const boxes: Record<string, BoxLayout> = {}
  for (const pageId of doc.pageOrder) {
    if (!doc.pageSettings[pageId].printIncluded) continue
    const paper = paperGeometry(doc.pageSettings[pageId].paper, size)
    for (const element of doc.pages[pageId]) {
      if (element.hidden || element.type !== 'text') continue
      const key = `${pageId}:${element.id}`
      boxes[key] = { pageId, elementId: element.id, runs: [], issues: [] }
      const guided = element.writingMode === 'guided'
      const x = guided ? Math.max(element.x, paper?.left ?? 20) : element.x + 4
      const y = guided ? element.y : element.y + 4
      const addressBoundary = doc.formatId?.startsWith('postcard_') && doc.pageSettings[pageId].side === 'back' ? size.width * .45 : size.width
      const right = guided ? Math.min(element.x + element.width, paper?.right ?? size.width - 20, addressBoundary) : element.x + element.width - 4
      const bottom = guided ? Math.min(element.y + element.height, paper?.bottom ?? size.height - 20) : element.y + element.height - 4
      regions.push({ key, pageId, element, x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y), firstBaseline: guided ? paper?.firstBaseline : undefined, spacing: guided ? paper?.lineSpacing : undefined })
    }
  }
  for (const region of regions) {
    if (region.element.continuesFrom) continue
    const linked = regions.filter(candidate => candidate.element.continuesFrom === region.key)
    compose(elementStory(region.element), [region, ...linked], values, metrics, boxes)
  }
  for (const region of regions) if (region.element.continuesFrom && !boxes[region.element.continuesFrom]) boxes[region.key].issues.push({ pageId: region.pageId, elementId: region.element.id, rule: 'overflow', message: 'This continuation has lost its source text box. Restore the source or remove the continuation.' })
  return { boxes, issues: Object.values(boxes).flatMap(box => box.issues) }
}
