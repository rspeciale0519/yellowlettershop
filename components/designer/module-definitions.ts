import {
  ImageIcon,
  MessageSquareText,
  QrCode,
  RectangleHorizontal,
  Table2,
  Type,
} from "lucide-react"
import type { DesignElement, DesignerElementType } from "@/types/designer"

export type DesignerModule = {
  id: string
  label: string
  description: string
  type: DesignerElementType
  icon: typeof Type
}

export const DESIGNER_MODULES: DesignerModule[] = [
  { id: "heading", label: "Heading", description: "Large editable headline", type: "text", icon: Type },
  { id: "body", label: "Body Text", description: "Paragraph or offer copy", type: "text", icon: MessageSquareText },
  { id: "image", label: "Image", description: "Upload or placeholder image", type: "image", icon: ImageIcon },
  { id: "shape", label: "Graphic", description: "Shape, line, or callout", type: "graphic", icon: RectangleHorizontal },
  { id: "qr", label: "QR Code", description: "Scannable URL or text code", type: "qr", icon: QrCode },
  { id: "table", label: "Table", description: "Editable rows and columns", type: "table", icon: Table2 },
]

export function createElementId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createModuleElement(
  moduleId: string,
  position: { x: number; y: number },
  zIndex: number,
): DesignElement {
  const id = createElementId(moduleId)

  if (moduleId === "heading") {
    return {
      id,
      name: "Heading",
      type: "text",
      content: "New Headline",
      x: position.x,
      y: position.y,
      width: 320,
      height: 54,
      fontSize: 34,
      fontWeight: "bold",
      fontFamily: "arial",
      textAlign: "center",
      color: "#111827",
      zIndex,
    }
  }

  if (moduleId === "body") {
    return {
      id,
      name: "Body Text",
      type: "text",
      content: "Double-click to edit this text.",
      x: position.x,
      y: position.y,
      width: 320,
      height: 72,
      fontSize: 18,
      fontWeight: "normal",
      fontFamily: "arial",
      textAlign: "left",
      color: "#111827",
      zIndex,
    }
  }

  if (moduleId === "image") {
    return {
      id,
      name: "Image",
      type: "image",
      src: "placeholder:Image",
      x: position.x,
      y: position.y,
      width: 260,
      height: 180,
      fit: "cover",
      zIndex,
    }
  }

  if (moduleId === "qr") {
    return {
      id,
      name: "QR Code",
      type: "qr",
      value: "https://yellowlettershop.com",
      x: position.x,
      y: position.y,
      width: 140,
      height: 140,
      foreground: "#111827",
      background: "#ffffff",
      zIndex,
    }
  }

  if (moduleId === "table") {
    return {
      id,
      name: "Table",
      type: "table",
      rows: 2,
      columns: 2,
      cells: [
        ["Name", "Value"],
        ["Phone", "{{sender_phone}}"],
      ],
      headerRow: true,
      x: position.x,
      y: position.y,
      width: 320,
      height: 120,
      zIndex,
    }
  }

  return {
    id,
    name: "Graphic",
    type: "graphic",
    shape: "rectangle",
    fill: "#facc15",
    stroke: "#111827",
    strokeWidth: 0,
    x: position.x,
    y: position.y,
    width: 220,
    height: 80,
    zIndex,
  }
}
