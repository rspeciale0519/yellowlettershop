import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { MAIL_FORMATS, canvasSizePx, DESIGN_PPI, type MailFormatId, type MailOrientation } from "@/components/designer/mail-spec"
import { substitute } from "@/components/designer/tokens/token-engine"
import type { TokenContext } from "@/components/designer/tokens/recipient-map"
import type { DesignElement, DesignerDocument, DesignerPage } from "@/types/designer"
import { hexToRgb01 } from "@/app/api/design/preview/_render/colors"

// Phase 10 core: vector render of background + graphics + token-substituted
// text (standard fonts) at 300 DPI with full bleed + crop marks. Images/QR/
// tables/custom fonts arrive in Phase 11.
const PT_PER_IN = 72
const PX_TO_PT = PT_PER_IN / DESIGN_PPI

function col(hex: string) {
  const c = hexToRgb01(hex)
  return rgb(c.r, c.g, c.b)
}

function drawElement(
  page: PDFPage,
  element: DesignElement,
  ctx: TokenContext,
  geom: { bleedPt: number; mediaH: number },
  fonts: { regular: PDFFont; bold: PDFFont },
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
        x,
        y: yBottom,
        width: w,
        height: h,
        color: fill,
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
    const isBold = element.fontWeight === "bold" || (typeof element.fontWeight === "number" && element.fontWeight >= 600)
    page.drawText(text, {
      x: x + 2,
      y: geom.mediaH - geom.bleedPt - element.y * PX_TO_PT - size,
      size,
      font: isBold ? fonts.bold : fonts.regular,
      color: col(element.color ?? "#111827"),
      maxWidth: w,
      lineHeight: size * (element.lineHeight ?? 1.2),
    })
  }
  // image / qr / table: Phase 11
}

function drawCropMarks(page: PDFPage, mediaW: number, mediaH: number, bleedPt: number) {
  const len = 9
  const mark = rgb(0, 0, 0)
  const corners = [
    { x: bleedPt, y: bleedPt },
    { x: mediaW - bleedPt, y: bleedPt },
    { x: bleedPt, y: mediaH - bleedPt },
    { x: mediaW - bleedPt, y: mediaH - bleedPt },
  ]
  for (const c of corners) {
    const sx = c.x < mediaW / 2 ? -1 : 1
    const sy = c.y < mediaH / 2 ? -1 : 1
    page.drawLine({ start: { x: c.x, y: c.y }, end: { x: c.x + sx * len, y: c.y }, thickness: 0.5, color: mark })
    page.drawLine({ start: { x: c.x, y: c.y }, end: { x: c.x, y: c.y + sy * len }, thickness: 0.5, color: mark })
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
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }

  for (const pageName of ["front", "back"] as DesignerPage[]) {
    const page = pdf.addPage([mediaW, mediaH])
    const bg = doc.backgrounds?.[pageName]
    if (bg?.color) {
      page.drawRectangle({ x: 0, y: 0, width: mediaW, height: mediaH, color: col(bg.color) })
    }
    const elements = [...doc.pages[pageName]]
      .filter((el) => !el.hidden)
      .sort((a, b) => a.zIndex - b.zIndex)
    for (const element of elements) {
      drawElement(page, element, ctx, { bleedPt, mediaH }, fonts)
    }
    if (opts?.addCropMarks !== false) drawCropMarks(page, mediaW, mediaH, bleedPt)
  }

  return pdf.save()
}
