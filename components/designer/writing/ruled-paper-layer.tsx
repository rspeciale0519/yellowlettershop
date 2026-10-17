"use client"
import { paperGeometry } from '@/lib/designer/text/paper'
import { canvasSizePx } from '@/components/designer/mail-spec'
import { useDesignerTextLayout } from './text-layout-context'
export function RuledPaperLayer() {
  const context = useDesignerTextLayout()
  if (!context) return null
  const doc = context.document
  const size = canvasSizePx(doc.formatId ?? 'letter_8_5x11', doc.orientation)
  const paper = paperGeometry(doc.pageSettings?.[context.pageId]?.paper ?? 'plain', size)
  if (!paper) return null
  const baselines: number[] = []
  for (let y = paper.firstBaseline; y <= paper.bottom; y += paper.lineSpacing) baselines.push(y)
  return <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true" data-paper-type={doc.pageSettings?.[context.pageId]?.paper}>
    <rect width={size.width} height={size.height} fill={paper.color}/>
    {baselines.map(y => <line key={y} data-paper-baseline={y} x1={25} x2={size.width-25} y1={y} y2={y} stroke={paper.lineColor} strokeWidth={.4/.72}/>)}
    <line x1={85} x2={85} y1={0} y2={size.height} stroke="#dda9a9" strokeWidth={.5/.72}/>
  </svg>
}
