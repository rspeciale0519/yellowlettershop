import type { DesignerPage } from '../../../types/designer'
import type { TextStyle } from '../../../types/designer-document'
export interface FontMetrics {
  measure(text: string, style: TextStyle): number
  ascent(style: TextStyle, text?: string): number
  descent?(style: TextStyle, text?: string): number
  supports(text: string, style: TextStyle): boolean
}
export type ResolvedValues = Record<string, string>
export interface PositionedRun { text: string; x: number; baseline: number; width: number; style: TextStyle }
export interface TextLayoutIssue { pageId: DesignerPage; elementId: string; rule: 'overflow' | 'font'; message: string }
export interface BoxLayout { pageId: DesignerPage; elementId: string; runs: PositionedRun[]; issues: TextLayoutIssue[] }
export interface DocumentLayout { boxes: Record<string, BoxLayout>; issues: TextLayoutIssue[] }
