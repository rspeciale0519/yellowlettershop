import type { MailFormatId } from "@/components/designer/mail-spec"

// Phase 12: dead `"colors" | "background"` Tool members removed (the only
// consumer, legacy tools-sidebar.tsx, is archived). Page backgrounds live in
// the `"background"` WorkspacePanel below.
export type Tool = "text" | "images" | "graphics" | "qr-codes" | "tables" | "postage"
export type WorkspacePanel = "modules" | "layers" | "inspector" | "preflight" | "background"
export type DesignerPage = "front" | "back"
export type DesignerOrientation = "portrait" | "landscape"
export type DesignerElementType = "text" | "image" | "graphic" | "qr" | "table" | "postage"
export type DesignerMode = "select" | "pan"

export interface CanvasSize {
  width: number
  height: number
}

interface BaseDesignElement {
  id: string
  name: string
  type: DesignerElementType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  locked?: boolean
  hidden?: boolean
  opacity?: number
  rotation?: number
}

export interface TextDesignElement extends BaseDesignElement {
  type: "text"
  content: string
  fontSize: number
  fontWeight: "normal" | "bold" | number
  fontFamily?: string
  color?: string
  textAlign?: "left" | "center" | "right"
  fontStyle?: "normal" | "italic"
  textDecoration?: "none" | "underline"
  lineHeight?: number
  letterSpacing?: number
}

export interface ImageDesignElement extends BaseDesignElement {
  type: "image"
  content?: string
  src: string
  assetId?: string
  sourceUrl?: string
  fit?: "cover" | "contain"
}

export interface GraphicDesignElement extends BaseDesignElement {
  type: "graphic"
  shape: "rectangle" | "circle" | "line" | "badge"
  fill: string
  stroke?: string
  strokeWidth?: number
  borderRadius?: number
}

export interface QrDesignElement extends BaseDesignElement {
  type: "qr"
  value: string
  foreground: string
  background: string
}

export interface TableDesignElement extends BaseDesignElement {
  type: "table"
  rows: number
  columns: number
  cells: string[][]
  headerRow?: boolean
}

// Postage compliance element (stamp or indicia). Movable, locked by default,
// keep-clear (no other element may overlap it). Singleton + mutually exclusive.
export interface PostageDesignElement extends BaseDesignElement {
  type: "postage"
  kind: "stamp" | "indicia"
}

export type DesignElement =
  | TextDesignElement
  | ImageDesignElement
  | GraphicDesignElement
  | QrDesignElement
  | TableDesignElement
  | PostageDesignElement

export interface PageBackgroundImage {
  assetId?: string
  src: string
  sourceUrl?: string
  fit: "cover" | "contain"
  opacity?: number
}

export interface PageBackground {
  color?: string
  image?: PageBackgroundImage
  // FUTURE: gradient?: PageGradient — render order = color, then image
}

export interface DesignerDocument {
  designId?: string
  templateId: string
  templateName: string
  orientation: DesignerOrientation
  formatId?: MailFormatId
  pages: Record<DesignerPage, DesignElement[]>
  backgrounds?: Partial<Record<DesignerPage, PageBackground>>
  updatedAt: string
}

export interface DesignerImageAsset {
  id: string
  name: string
  url: string
  sourceUrl: string
  size?: number
  createdAt?: string
}
