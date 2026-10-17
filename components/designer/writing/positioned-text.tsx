"use client"
import { printCssFamily } from '@/lib/designer/text/font-manifest'
import type { TextDesignElement } from '@/types/designer'
import { useDesignerTextLayout } from './text-layout-context'
export function PositionedText({ element, onEdit }: { element: TextDesignElement; onEdit: () => void }) {
  const context = useDesignerTextLayout()
  const box = context?.layout?.boxes[`${context.pageId}:${element.id}`]
  return <div className="relative h-full w-full" onDoubleClick={onEdit}>
    {box ? <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${element.width} ${element.height}`} role="img" aria-label={element.name}>
      {box.runs.map((run, index) => <text key={index} x={run.x-element.x} y={run.baseline-element.y} fill={run.style.color ?? '#111827'} fontSize={run.style.fontSize} fontWeight={run.style.bold ? 700 : 400} fontStyle={run.style.italic ? 'italic' : 'normal'} fontFamily={printCssFamily(run.style)} textDecoration={run.style.underline ? 'underline' : undefined} textLength={run.width || undefined} lengthAdjust="spacingAndGlyphs" xmlSpace="preserve">{run.text}</text>)}
    </svg> : <div className="whitespace-pre-wrap p-1" style={{ fontSize: element.fontSize }}>{element.continuesFrom ? '' : element.content}</div>}
    {box?.issues.some(issue => issue.rule === 'overflow') && <span className="absolute bottom-0 right-0 rounded bg-red-600 px-1 text-[10px] text-white" aria-label="Text overflow">Text does not fit</span>}
  </div>
}
