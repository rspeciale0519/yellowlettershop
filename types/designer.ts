export type Tool = "text" | "images" | "graphics" | "qr-codes" | "tables" | "colors" | "background"
export type WorkspacePanel = "modules" | "layers" | "inspector" | "preflight"
export type DesignerPage = "front" | "back"
export type DesignerOrientation = "portrait" | "landscape"
export type DesignerElementType = "text" | "image" | "graphic" | "qr" | "table"
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
}

export interface TextDesignElement extends BaseDesignElement {
  type: "text"
  content: string
  fontSize: number
  fontWeight: "normal" | "bold" | number
  fontFamily?: string
  color?: string
  textAlign?: "left" | "center" | "right"
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

export type DesignElement =
  | TextDesignElement
  | ImageDesignElement
  | GraphicDesignElement
  | QrDesignElement
  | TableDesignElement

export interface DesignerDocument {
  designId?: string
  templateId: string
  templateName: string
  orientation: DesignerOrientation
  pages: Record<DesignerPage, DesignElement[]>
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
