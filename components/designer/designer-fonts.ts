export type DesignerFont = {
  id: string
  label: string
  cssFamily: string
  enabled: boolean
}

export const DESIGNER_FONTS: DesignerFont[] = [
  { id: "arial", label: "Arial", cssFamily: "Arial, sans-serif", enabled: true },
  { id: "georgia", label: "Georgia", cssFamily: "Georgia, serif", enabled: true },
  { id: "times", label: "Times New Roman", cssFamily: "'Times New Roman', serif", enabled: true },
  { id: "courier", label: "Courier New", cssFamily: "'Courier New', monospace", enabled: true },
  { id: "handwriting", label: "Handwritten", cssFamily: "'Comic Sans MS', 'Bradley Hand', cursive", enabled: true },
]

export function getFontFamily(fontId?: string, fonts = DESIGNER_FONTS) {
  return fonts.find((font) => font.id === fontId && font.enabled)?.cssFamily ?? fonts[0]?.cssFamily ?? DESIGNER_FONTS[0].cssFamily
}
