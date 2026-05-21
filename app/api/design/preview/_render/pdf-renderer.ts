import { PDFDocument, StandardFonts, rgb, type PDFDocument as PDFDoc, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import QRCode from "qrcode"
import { MAIL_FORMATS, canvasSizePx, DESIGN_PPI, type MailFormatId, type MailOrientation } from "@/components/designer/mail-spec"
import { substitute } from "@/components/designer/tokens/token-engine"
import type { TokenContext } from "@/components/designer/tokens/recipient-map"
import type { DesignElement, DesignerDocument, DesignerPage, PageBackground } from "@/types/designer"
import { hexToRgb01 } from "@/app/api/design/preview/_render/colors"

const PT_PER_IN = 72
const PX_TO_PT = PT_PER_IN / DESIGN_PPI

function col(hex: string) {
  const c = hexToRgb01(hex)
  return rgb(c.r, c.g, c.b)
}

interface FontSet {
  sans: PDFFont
  sansBold: PDFFont
  sansItalic: PDFFont
  serif: PDFFont
  mono: PDFFont
}

function pickFont(fonts: FontSet, family: string | undefined, bold: boolean, italic: boolean): PDFFont {
  const f = (family ?? "").toLowerCase()
  if (f.includes("times") || f.includes("georgia") || f.includes("serif")) return fonts.serif
  if (f.includes("courier") || f.includes("mono")) return fonts.mono
  if (f.includes("hand") || italic) return fonts.sansItalic
  return bold ? fonts.sansBold : fonts.sans
}

async function fetchImageBytes(src: string): Promise<{ bytes: Uint8Array; kind: "png" | "jpg" } | null> {
  try {
    if (src.startsWith("placeholder:")) return null
    if (src.startsWith("data:")) {
      const [meta, b64] = src.split(",")
      const bytes = Uint8Array.from(Buffer.from(b64, "base64"))
      return { bytes, kind: meta.includes("jpeg") || meta.includes("jpg") ? "jpg" : "png" }
    }
    const res = await fetch(src)
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8
    return { bytes: buf, kind: isJpg ? "jpg" : "png" }
  } catch {
    return null
  }
}

async function embedImage(pdf: PDFDoc, src: string) {
  const img = await fetchImageBytes(src)
  if (!img) return null
  try {
    return img.kind === "jpg" ? await pdf.embedJpg(img.bytes) : await pdf.embedPng(img.bytes)
  } catch {
    return null
  }
}

async function drawElement(
  pdf: PDFDoc,
  page: PDFPage,
  element: DesignElement,
  ctx: TokenContext,
  geom: { bleedPt: number; mediaH: number },
  fonts: FontSet,
) {
  const x = geom.bleedPt + element.x * PX_TO_PT
  const w = element.width * PX_TO_PT
  const h = element.height * PX_TO_PT
  const yBottom = geom.mediaH - geom.bleedPt - (element.y + element.height) * PX_TO_PT

  if (element.type === "graphic") {
    const fill = col(element.fill)
    if (element.shape === "circle") {
      page.drawEllipse({ x: x + w / 2, y: yBottom + h / 2, xScale: w / 2, yScale: h / 2, color: fill })
    } else if (element.shape === "line") {
      const thickness = Math.max(1, (element.strokeWidth ?? 4) * PX_TO_PT)
      page.drawLine({ start: { x, y: yBottom + h / 2 }, end: { x: x + w, y: yBottom + h / 2 }, thickness, color: col(element.stroke ?? element.fill) })
    } else {
      page.drawRectangle({
        x, y: yBottom, width: w, height: h, color: fill,
        borderColor: element.strokeWidth ? col(element.stroke ?? element.fill) : undefined,
        borderWidth: element.strokeWidth ? element.strokeWidth * PX_TO_PT : undefined,
      })
    }
    return
  }

  if (element.type === "text") {
    const text = substitute(element.content, ctx)
    if (!text) return
    const size = element.fontSize * PX_TO_PT
    const bold = element.fontWeight === "bold" || (typeof element.fontWeight === "number" && element.fontWeight >= 600)
    page.drawText(text, {
      x: x + 2,
      y: geom.mediaH - geom.bleedPt - element.y * PX_TO_PT - size,
      size,
      font: pickFont(fonts, element.fontFamily, bold, element.fontStyle === "italic"),
      color: col(element.color ?? "#111827"),
      maxWidth: w,
      lineHeight: size * (element.lineHeight ?? 1.2),
    })
    return
  }

  if (element.type === "image") {
    const embedded = await embedImage(pdf, element.src)
    if (embedded) page.drawImage(embedded, { x, y: yBottom, width: w, height: h })
    return
  }

  if (element.type === "qr") {
    try {
      const fg = element.foreground || "#111827"
      const bg = element.background || "#ffffff"
      const png = await QRCode.toBuffer(substitute(element.value, ctx) || " ", {
        margin: 1,
        color: { dark: fg, light: bg },
        width: Math.max(64, Math.round(w)),
      })
      const embedded = await pdf.embedPng(Uint8Array.from(png))
      page.drawImage(embedded, { x, y: yBottom, width: w, height: h })
    } catch {
      /* skip unrenderable QR */
    }
    return
  }

  if (element.type === "table") {
    const rows = element.cells.length || 1
    const cols = element.cells[0]?.length || 1
    const cw = w / cols
    const ch = h / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = x + c * cw
        const cy = yBottom + h - (r + 1) * ch
        page.drawRectangle({ x: cx, y: cy, width: cw, height: ch, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 })
        const cell = substitute(element.cells[r]?.[c] ?? "", ctx)
        if (cell) {
          page.drawText(cell, { x: cx + 3, y: cy + ch / 2 - 4, size: 8, font: fonts.sans, color: rgb(0.06, 0.06, 0.06), maxWidth: cw - 6 })
        }
      }
    }
  }
}

function drawCropMarks(page: PDFPage, mediaW: number, mediaH: number, bleedPt: number) {
  const len = 9
  const mark = rgb(0, 0, 0)
  for (const c of [
    { x: bleedPt, y: bleedPt },
    { x: mediaW - bleedPt, y: bleedPt },
    { x: bleedPt, y: mediaH - bleedPt },
    { x: mediaW - bleedPt, y: mediaH - bleedPt },
  ]) {
    const sx = c.x < mediaW / 2 ? -1 : 1
    const sy = c.y < mediaH / 2 ? -1 : 1
    page.drawLine({ start: { x: c.x, y: c.y }, end: { x: c.x + sx * len, y: c.y }, thickness: 0.5, color: mark })
    page.drawLine({ start: { x: c.x, y: c.y }, end: { x: c.x, y: c.y + sy * len }, thickness: 0.5, color: mark })
  }
}

async function drawBackground(pdf: PDFDoc, page: PDFPage, bg: PageBackground | undefined, mediaW: number, mediaH: number) {
  if (!bg) return
  if (bg.color) page.drawRectangle({ x: 0, y: 0, width: mediaW, height: mediaH, color: col(bg.color) })
  if (bg.image && !bg.image.src.startsWith("placeholder:")) {
    const embedded = await embedImage(pdf, bg.image.src)
    if (embedded) page.drawImage(embedded, { x: 0, y: 0, width: mediaW, height: mediaH, opacity: bg.image.opacity ?? 1 })
  }
}

export async function renderDesignToPdf(
  doc: DesignerDocument,
  ctx: TokenContext,
  formatId: MailFormatId,
  orientation: MailOrientation,
  opts?: { addCropMarks?: boolean },
): Promise<Uint8Array> {
  const trim = canvasSizePx(formatId, orientation)
  const bleedIn = MAIL_FORMATS[formatId].bleedIn
  const bleedPt = bleedIn * PT_PER_IN
  const mediaW = (trim.width / DESIGN_PPI + 2 * bleedIn) * PT_PER_IN
  const mediaH = (trim.height / DESIGN_PPI + 2 * bleedIn) * PT_PER_IN

  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fonts: FontSet = {
    sans: await pdf.embedFont(StandardFonts.Helvetica),
    sansBold: await pdf.embedFont(StandardFonts.HelveticaBold),
    sansItalic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    serif: await pdf.embedFont(StandardFonts.TimesRoman),
    mono: await pdf.embedFont(StandardFonts.Courier),
  }

  for (const pageName of ["front", "back"] as DesignerPage[]) {
    const page = pdf.addPage([mediaW, mediaH])
    await drawBackground(pdf, page, doc.backgrounds?.[pageName], mediaW, mediaH)
    const elements = [...doc.pages[pageName]].filter((el) => !el.hidden).sort((a, b) => a.zIndex - b.zIndex)
    for (const element of elements) {
      await drawElement(pdf, page, element, ctx, { bleedPt, mediaH }, fonts)
    }
    if (opts?.addCropMarks !== false) drawCropMarks(page, mediaW, mediaH, bleedPt)
  }

  return pdf.save()
}
