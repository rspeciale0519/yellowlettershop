import type { DesignElement, DesignerDocument, DesignerPage, PageBackground } from './designer'

export interface TextStyle {
  fontSize: number
  fontFamily?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  letterSpacing?: number
}
export interface StoryRun { text: string; field?: string; style?: Partial<TextStyle> }
export interface StoryParagraph { runs: StoryRun[]; align?: 'left' | 'center' | 'right' }
export interface RichTextStory { id: string; paragraphs: StoryParagraph[]; style: TextStyle }
export type PaperType = 'plain' | 'white-notepad' | 'yellow-notepad'
export interface ContentRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
  firstBaseline?: number
  lineSpacing?: number
}
export interface PageSettings {
  printIncluded: boolean
  sheetIndex: number
  side: 'front' | 'back'
  paper: PaperType
  regions: ContentRegion[]
}
export interface DesignPage extends PageSettings {
  id: DesignerPage
  elements: DesignElement[]
  background?: PageBackground
}
export interface DesignerDocumentV2 extends DesignerDocument {
  version: 2
  pageOrder: DesignerPage[]
  pageSettings: Record<string, PageSettings>
}
