import { PDFDocument, degrees, rgb, type PDFDocument as PDFDoc, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import QRCode from "qrcode"
import { MAIL_FORMATS, canvasSizePx, DESIGN_PPI, type MailFormatId, type MailOrientation } from "@/components/designer/mail-spec"
import { getPrintFontBinaries } from "@/lib/designer/text/server-fonts"
import { createFontMetrics } from "@/lib/designer/text/font-metrics"
import { printFontKey, PRINT_FONT_FEATURES } from "@/lib/designer/text/font-manifest"
import { layoutDesignerDocument } from "@/lib/designer/text/layout"
import { paperGeometry } from "@/lib/designer/text/paper"
import type { BoxLayout, FontMetrics } from "@/lib/designer/text/types"
import { getPrintedPages } from "@/lib/designer/document/pages"
import { substitute } from "@/components/designer/tokens/token-engine"
import type { TokenContext } from "@/components/designer/tokens/recipient-map"
import type { DesignElement, DesignerDocument, PageBackground } from "@/types/designer"
import { hexToRgb01 } from "@/app/api/design/preview/_render/colors"
import { pdfAngleFromCss, rotateAbout, type Pt } from "@/app/api/design/preview/_render/transform"

const PT_PER_IN = 72
const PX_TO_PT = PT_PER_IN / DESIGN_PPI

function col(hex: string) {
  const c = hexToRgb01(hex)
  return rgb(c.r, c.g, c.b)
}

type FontSet = Record<string, PDFFont>

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
  textLayout?: BoxLayout,
  metrics?: FontMetrics,
) {
  const x = geom.bleedPt + element.x * PX_TO_PT
  const w = element.width * PX_TO_PT
  const h = element.height * PX_TO_PT
  const yBottom = geom.mediaH - geom.bleedPt - (element.y + element.height) * PX_TO_PT

  // Element rotation (CSS clockwise, about the box center) + opacity. Both are
  // no-ops when unset, so unrotated/opaque elements render exactly as before.
  const opacity = element.opacity ?? 1
  const a = pdfAngleFromCss(element.rotation) // pdf-lib angle (CCW, y-up)
  const center: Pt = { x: x + w / 2, y: yBottom + h / 2 }
  const rot = a ? { rotate: degrees(a) } : {}
  // Move a primitive's draw anchor so that, once pdf-lib spins it about that
  // anchor by `a`, its body pivots around the box center instead of a corner.
  const anchor = (px: number, py: number): Pt => rotateAbout({ x: px, y: py }, center, a)

  if (element.type === "graphic") {
    const fill = col(element.fill)
    if (element.shape === "circle") {
      // Ellipse anchor IS the box center, so it pivots about itself.
      page.drawEllipse({ x: center.x, y: center.y, xScale: w / 2, yScale: h / 2, color: fill, opacity, ...rot })
    } else if (element.shape === "line") {
      const thickness = Math.max(1, (element.strokeWidth ?? 4) * PX_TO_PT)
      // drawLine has no rotate option; rotate both endpoints about the center.
      const s = anchor(x, yBottom + h / 2)
      const e = anchor(x + w, yBottom + h / 2)
      page.drawLine({ start: s, end: e, thickness, color: col(element.stroke ?? element.fill), opacity })
    } else {
      const p = anchor(x, yBottom)
      page.drawRectangle({
        x: p.x, y: p.y, width: w, height: h, color: fill, opacity,
        borderColor: element.strokeWidth ? col(element.stroke ?? element.fill) : undefined,
        borderWidth: element.strokeWidth ? element.strokeWidth * PX_TO_PT : undefined,
        borderOpacity: element.strokeWidth ? opacity : undefined,
        ...rot,
      })
    }
    return
  }

  if (element.type === "text") {
    for (const run of textLayout?.runs ?? []) {
      const font = fonts[printFontKey(run.style)]
      const draw = (text: string, offset: number) => {
        const p = anchor(geom.bleedPt + (run.x + offset) * PX_TO_PT, geom.mediaH - geom.bleedPt - run.baseline * PX_TO_PT)
        page.drawText(text, { x: p.x, y: p.y, size: run.style.fontSize * PX_TO_PT, font, color: col(run.style.color ?? "#111827"), opacity, ...rot })
      }
      if (run.style.letterSpacing && metrics) {
        const graphemes = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(run.text), part => part.segment)
        let prefix = ""
        for (const char of graphemes) { draw(char, metrics.measure(prefix, run.style) + (prefix ? run.style.letterSpacing : 0)); prefix += char }
      } else draw(run.text, 0)
      if (run.style.underline) {
        const start = anchor(geom.bleedPt + run.x * PX_TO_PT, geom.mediaH - geom.bleedPt - (run.baseline + 2) * PX_TO_PT)
        const end = anchor(geom.bleedPt + (run.x + run.width) * PX_TO_PT, geom.mediaH - geom.bleedPt - (run.baseline + 2) * PX_TO_PT)
        page.drawLine({ start, end, thickness: .6, color: col(run.style.color ?? "#111827"), opacity })
      }
    }
    return
  }

  if (element.type === "image") {
    const embedded = await embedImage(pdf, element.src)
    if (embedded) {
      const p = anchor(x, yBottom)
      page.drawImage(embedded, { x: p.x, y: p.y, width: w, height: h, opacity, ...rot })
    }
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
      const p = anchor(x, yBottom)
      page.drawImage(embedded, { x: p.x, y: p.y, width: w, height: h, opacity, ...rot })
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
        // Each cell pivots about the whole table's center → rigid rotation.
        const cp = anchor(cx, cy)
        page.drawRectangle({ x: cp.x, y: cp.y, width: cw, height: ch, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5, borderOpacity: opacity, ...rot })
        const cell = substitute(element.cells[r]?.[c] ?? "", ctx)
        if (cell) {
          const tp = anchor(cx + 3, cy + ch / 2 - 4)
          page.drawText(cell, { x: tp.x, y: tp.y, size: 8, font: fonts['sans-regular'], color: rgb(0.06, 0.06, 0.06), maxWidth: cw - 6, opacity, ...rot })
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
  const binaries = await getPrintFontBinaries()
  const metrics = createFontMetrics(binaries)
  const layout = layoutDesignerDocument({ ...doc, formatId, orientation }, ctx.values, metrics)
  const fontIssue = layout.issues.find(issue => issue.rule === "font")
  if (fontIssue) throw new Error(fontIssue.message)
  const usedFonts=new Set(Object.values(layout.boxes).flatMap(box=>box.runs.map(run=>printFontKey(run.style))))
  if(getPrintedPages(doc).some(page=>page.elements.some(element=>element.type==='table' && !element.hidden))) usedFonts.add('sans-regular')
  // fontkit's Caveat subset omits composite outlines; retain its full small font.
  const fonts: FontSet = Object.fromEntries(await Promise.all([...usedFonts].map(async key => [key, await pdf.embedFont(binaries[key], { subset: !key.startsWith('handwriting-'), features: PRINT_FONT_FEATURES })])))

  for (const designPage of getPrintedPages(doc)) {
    const pageName = designPage.id
    const page = pdf.addPage([mediaW, mediaH])
    await drawBackground(pdf, page, doc.backgrounds?.[pageName], mediaW, mediaH)
    const paper = paperGeometry(designPage.paper, trim)
    if (paper) {
      page.drawRectangle({ x: bleedPt, y: bleedPt, width: trim.width * PX_TO_PT, height: trim.height * PX_TO_PT, color: col(paper.color) })
      for (let baseline = paper.firstBaseline; baseline <= paper.bottom; baseline += paper.lineSpacing) {
        const y = mediaH - bleedPt - baseline * PX_TO_PT
        page.drawLine({ start: { x: bleedPt + 25 * PX_TO_PT, y }, end: { x: bleedPt + (trim.width - 25) * PX_TO_PT, y }, thickness: .4, color: col(paper.lineColor) })
      }
      page.drawLine({ start: { x: bleedPt + 85 * PX_TO_PT, y: bleedPt }, end: { x: bleedPt + 85 * PX_TO_PT, y: mediaH - bleedPt }, thickness: .5, color: col("#dda9a9") })
    }
    const elements = [...doc.pages[pageName]].filter((el) => !el.hidden).sort((a, b) => a.zIndex - b.zIndex)
    for (const element of elements) {
      await drawElement(pdf, page, element, ctx, { bleedPt, mediaH }, fonts, layout.boxes[`${pageName}:${element.id}`], metrics)
    }
    if (opts?.addCropMarks !== false) drawCropMarks(page, mediaW, mediaH, bleedPt)
  }

  return pdf.save()
}
