import { MAIL_FORMATS } from "@/components/designer/mail-spec"
import type { MailFormatId, MailOrientation } from "@/components/designer/mail-spec"
import type { PaperStock } from "./core/paper-stocks"

// PaperStock literals for the designer's four mail formats. One base carries
// the shared matte-PBR numbers (proven on the letter-inspector stocks); each
// format overrides only its physical identity. All art stocks are unruled
// with no address side or show-through — the captured design IS both faces.

const BASE: Omit<PaperStock, "id" | "label" | "caption" | "widthIn" | "heightIn" | "unitsPerInch"> = {
  colorHex: "#fcfcfa",
  edgeHex: "#e8e6df",
  ruled: false,
  hasAddressSide: false,
  thickness: 0.0024,
  roughness: 0.62,
  sheen: 0.2,
  sheenRoughness: 0.85,
  sheenColorHex: "#ffffff",
  specularIntensity: 0.42,
  anisotropyStrength: 0.55,
  mdVertical: true,
  normalScale: 0.6,
  toothScale: 0.7,
  edgeStyle: "fibrous",
  bendLag: 0.22,
  liftAmp: 0.08,
  restWarpAmp: 0.004,
  cornerLift: 0.005,
  edgeRippleAmp: 0.0005,
  edgeRippleLen: 0.26,
  warpMode: "sheet",
  flutterAmpRad: 0.03,
  breatheAmp: 0.004,
  settleLambda: 7.5,
  showThroughAlpha: 0,
}

/** Postcard board physics (32pt-style: rigid, die-cut, single-axis bow). */
const BOARD: Partial<PaperStock> = {
  thickness: 0.009,
  roughness: 0.55,
  sheen: 0.12,
  sheenRoughness: 0.8,
  sheenColorHex: "#f8f2e2",
  specularIntensity: 0.5,
  anisotropyStrength: 0.6,
  mdVertical: false,
  normalScale: 0.45,
  toothScale: 0.4,
  edgeStyle: "diecut",
  bendLag: 0.05,
  liftAmp: 0.05,
  restWarpAmp: 0.0015,
  cornerLift: 0.001,
  edgeRippleAmp: 0.0003,
  edgeRippleLen: 0.3,
  warpMode: "board",
  flutterAmpRad: 0.008,
  breatheAmp: 0.0008,
  settleLambda: 11,
}

// Scene scale per format: sized so each piece fits the preview stage
// (letter precedent 0.14 u/in; postcards larger per-inch so small cards stay
// inspectable, tapering as the format grows — 6×11 landscape spans ~1.43u).
const FORMAT_SCALE: Record<MailFormatId, number> = {
  postcard_4x6: 0.19,
  postcard_6x9: 0.155,
  postcard_6x11: 0.13,
  letter_8_5x11: 0.14,
}

/** The paper stock the 3D preview should use for a designer document. */
export function formatStock(formatId: MailFormatId, orientation: MailOrientation): PaperStock {
  const format = MAIL_FORMATS[formatId]
  // Same swap as mail-spec's (unexported) orientedInches: formats are
  // portrait-natural; landscape swaps the axes.
  const wIn = orientation === "landscape" ? format.heightIn : format.widthIn
  const hIn = orientation === "landscape" ? format.widthIn : format.heightIn
  const isLetter = format.isLetter
  return {
    ...BASE,
    ...(isLetter ? {} : BOARD),
    id: `designer-${formatId}-${orientation}`,
    label: format.label,
    caption: format.label,
    widthIn: wIn,
    heightIn: hIn,
    unitsPerInch: FORMAT_SCALE[formatId],
    // Grain runs along the sheet's long side.
    mdVertical: hIn >= wIn,
  }
}
