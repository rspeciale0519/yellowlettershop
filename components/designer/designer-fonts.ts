export type DesignerFont = {
  id: string
  label: string
  cssFamily: string
  enabled: boolean
}

export const DESIGNER_FONTS: DesignerFont[] = [
  { id: "arial", label: "Print Sans", cssFamily: "'YLS Sans', sans-serif", enabled: true },
  { id: "georgia", label: "Georgia", cssFamily: "'YLS Serif', serif", enabled: true },
  { id: "times", label: "Times New Roman", cssFamily: "'YLS Serif', serif", enabled: true },
  { id: "courier", label: "Courier New", cssFamily: "'YLS Mono', monospace", enabled: true },
  { id: "handwriting", label: "Handwritten", cssFamily: "'YLS Handwriting', cursive", enabled: true },
]

export function getFontFamily(fontId?: string, fonts = DESIGNER_FONTS) {
  return fonts.find((font) => font.id === fontId && font.enabled)?.cssFamily ?? fonts[0]?.cssFamily ?? DESIGNER_FONTS[0].cssFamily
}
