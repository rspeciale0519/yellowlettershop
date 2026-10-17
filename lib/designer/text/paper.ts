import type { CanvasSize, TextDesignElement } from '../../../types/designer'
import type { PaperType } from '../../../types/designer-document'
export interface PaperGeometry { color: string; lineColor: string; firstBaseline: number; lineSpacing: number; left: number; right: number; bottom: number }
/** These vector paper profiles draw their rules from precisely the same geometry used for text. */
export function paperGeometry(paper: PaperType, size: CanvasSize): PaperGeometry | null {
  if (paper === 'plain') return null
  return { color: paper === 'yellow-notepad' ? '#fff5ad' : '#fffefb', lineColor: '#9db8d4', firstBaseline: 110, lineSpacing: 30, left: 100, right: size.width - 55, bottom: size.height - 60 }
}
export function guidedBox(element: TextDesignElement, paper: PaperType, size: CanvasSize): TextDesignElement {
  const profile = paperGeometry(paper, size)
  const left = profile?.left ?? 35
  const right = profile?.right ?? size.width - 35
  const top = profile ? profile.firstBaseline - 24 : 35
  const bottom = profile?.bottom ?? size.height - 35
  const x = Math.min(Math.max(element.x, left), right - 80)
  const y = Math.min(Math.max(element.y, top), bottom - 40)
  return { ...element, writingMode: 'guided', x, y, width: Math.max(40, right - x), height: Math.max(30, bottom - y), rotation: 0 }
}
