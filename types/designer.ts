export type Tool = "text" | "images" | "graphics" | "qr-codes" | "tables" | "colors" | "background"

export interface DesignElement {
  id: string
  type: "text" | "image"
  x: number
  y: number
  width: number
  height: number
  content?: string
  src?: string
  fontSize?: number
  fontWeight?: "normal" | "bold"
}
