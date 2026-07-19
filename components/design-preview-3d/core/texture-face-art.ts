/**
 * LETTER INSPECTOR — face artwork: everything that is *printed or written*
 * on the sheet (as opposed to the paper substrate itself, which lives in
 * texture-surface-maps.ts).
 *
 * Layouts are parametric per stock format: the yellow letter and white wove
 * are PORTRAIT 8.5"×11" sheets (canvas aspect matches exactly, so nothing
 * stretches); the heavyweight is a LANDSCAPE 6"×4" postcard.
 *
 * Realism decisions:
 *  - Ruling is faded BLUE wobbly polylines with per-segment alpha jitter and
 *    occasional gaps (cheap web-press printing), plus the classic double red
 *    vertical margin line.
 *  - The letter's back face carries baked show-through: the front ink drawn
 *    mirrored, softened via 5 offset low-alpha draws (NOT ctx.filter='blur',
 *    which older Safari silently ignores - multi-draw works everywhere).
 *  - Handwriting appears only ON the depicted mail piece (allowed there).
 */

import type { PaperStock } from './paper-stocks';
import { makeCanvas } from './texture-surface-maps';
import { paintMottle, paintSpeckle } from './substrate-painters';
import { rasterizeInkBlock } from './ink-engine';
import type { InkLine } from './ink-engine';
import type { FaceLayout } from './face-layouts';
export { layoutFor } from './face-layouts';
export type { FaceLayout } from './face-layouts';

const RECIPIENT: ReadonlyArray<string> = ['Maria Alvarez', '1408 Birchwood Ln', 'Mesa, AZ 85210'];

const PEN = '#2c3e7a';
const PRINT_INK = '#16140f';
const RULE_BLUE = '#7092c5';
const MARGIN_RED = '#cf6f6f';

/**
 * Gap (px) between a text baseline and its ruled line. Pen text is drawn at
 * `ruleStartY + i*ruleStep` (alphabetic baseline); the rule sits this far
 * below so letters REST ON the line rather than floating above it.
 */
const RULE_DESC_GAP = 6;

/**
 * Top-header band: a blank margin across the top of the pad, closed off by a
 * heavier double blue rule — the classic legal-pad head. `HEADER_FRAC` is the
 * band height as a fraction of the sheet; the ruling proper begins below it.
 */
const HEADER_FRAC = 0.085;

function headerY(lay: FaceLayout): number {
  return Math.round(lay.h * HEADER_FRAC);
}

/** The single heavier blue line that marks the header divider. */
function headerYs(lay: FaceLayout): number[] {
  return [headerY(lay) + 15];
}

/**
 * Ruled-line y positions: real legal-pad ruling is TIGHTER than the
 * handwriting cadence (half the pen step), evenly spaced. The pen baselines
 * (at whole steps) land on every OTHER line, exactly like the reference pad.
 * Ruling starts a clear step below the header divider (blank header band
 * above). The identical set feeds albedo / show-through / deboss mask.
 */
function ruleYs(lay: FaceLayout): number[] {
  const step = lay.ruleStep / 2;
  const stopAbove = headerY(lay) + step;
  const ys: number[] = [];
  let y = lay.ruleStartY + RULE_DESC_GAP;
  while (y - step > stopAbove) y -= step;
  for (; y <= lay.h - 20; y += step) ys.push(y);
  return ys;
}

/** Red margin-line x positions: one down the LEFT and one down the RIGHT. */
function marginXs(lay: FaceLayout): [number, number] {
  return [lay.marginX - 60, lay.w - 120];
}

/** Resolve the loaded Caveat family list from the design tokens. */
export function handFamily(): string {
  const fromVar =
    typeof document !== 'undefined'
      ? getComputedStyle(document.body).getPropertyValue('--yls-hand').trim()
      : '';
  return fromVar !== '' ? fromVar : 'cursive';
}

/** Letter-body lines laid out for the ink engine (baseline x/y + size). */
function bodyLines(lay: FaceLayout): InkLine[] {
  const last = lay.lines.length - 1;
  return lay.lines.map((text, i) => ({
    text,
    x: lay.marginX + (i === last ? lay.signIndent : 0),
    y: lay.ruleStartY + i * lay.ruleStep,
    size: i === 0 || i === last ? lay.penFirst : lay.penBody,
  }));
}

/** Handwritten recipient-block lines for the ink engine. */
function recipLines(lay: FaceLayout): InkLine[] {
  return RECIPIENT.map((text, i) => ({
    text,
    x: lay.recipX,
    y: lay.recipY + i * lay.recipStep,
    size: i === 0 ? lay.recipFirst : lay.recipBody,
  }));
}

/**
 * Ruling: wobbly faded-blue polylines drawn in short segments with sub-pixel
 * jitter, per-segment alpha jitter, and rare gaps.
 */
export function drawRules(ctx: CanvasRenderingContext2D, lay: FaceLayout): void {
  ctx.strokeStyle = RULE_BLUE;
  ctx.lineWidth = 2.6;
  ctx.globalAlpha = 0.85;
  for (const y of ruleYs(lay)) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(lay.w, y + 0.5);
    ctx.stroke();
  }
  // Top header: a single heavier rule closing the blank header band.
  ctx.lineWidth = 3.4;
  ctx.globalAlpha = 0.92;
  for (const y of headerYs(lay)) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(lay.w, y + 0.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** The red vertical margin lines — left and right, full bleed, crisp. */
export function drawMargin(ctx: CanvasRenderingContext2D, lay: FaceLayout): void {
  ctx.strokeStyle = MARGIN_RED;
  ctx.lineWidth = 2.8;
  ctx.globalAlpha = 0.82;
  for (const x of marginXs(lay)) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, lay.h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Front albedo: substrate variation + ruling + margin + handwriting. */
export function drawFrontAlbedo(
  ctx: CanvasRenderingContext2D,
  stock: PaperStock,
  lay: FaceLayout,
  hand: string,
  rng: () => number,
): void {
  ctx.fillStyle = stock.colorHex;
  ctx.fillRect(0, 0, lay.w, lay.h);
  paintMottle(ctx, lay.w, lay.h, rng, stock.colorHex);
  paintSpeckle(ctx, lay.w, lay.h, rng, stock.colorHex, stock.mdVertical);

  if (stock.ruled) {
    drawRules(ctx, lay);
    drawMargin(ctx, lay);
  }

  ctx.drawImage(rasterizeInkBlock(lay.w, lay.h, bodyLines(lay), hand, `${stock.id}-body`, PEN), 0, 0);
}

/**
 * Baked show-through of the front ink onto the back: mirrored, softened via
 * five slightly-offset low-alpha draws (browser-safe blur substitute).
 */
/** Muted olive-gray: blue ink diffused through paper reads olive, not blue. */
const SHOW_THROUGH_INK = '#4a544a';

function drawShowThrough(
  ctx: CanvasRenderingContext2D,
  stock: PaperStock,
  lay: FaceLayout,
  hand: string,
): void {
  if (stock.showThroughAlpha <= 0) return;
  const offsets: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [-1.6, -1.1],
    [1.6, 1.1],
    [-1.1, 1.6],
    [1.1, -1.6],
    [-2.6, 0],
    [2.6, 0],
  ];
  // One olive raster (identical placement to the front pen block), mirrored
  // and softened by multi-offset compositing.
  const olive = rasterizeInkBlock(lay.w, lay.h, bodyLines(lay), hand, `${stock.id}-body`, SHOW_THROUGH_INK);
  ctx.save();
  // Mirror horizontally: ink laid on the front reads reversed from behind.
  ctx.translate(lay.w, 0);
  ctx.scale(-1, 1);
  offsets.forEach(([dx, dy]) => {
    ctx.globalAlpha = stock.showThroughAlpha / offsets.length;
    ctx.drawImage(olive, dx, dy);
  });
  // Rules + margin ghost through even fainter than the pen ink.
  if (stock.ruled) {
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = RULE_BLUE;
    ctx.lineWidth = 2;
    for (const y of [...ruleYs(lay), ...headerYs(lay)]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(lay.w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = MARGIN_RED;
    marginXs(lay).forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, lay.h);
      ctx.stroke();
    });
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

/**
 * Back albedo. A LETTER's back is just the same blank sheet (ruling shows
 * through both sides of a pad) — no addresses or postage, which live on the
 * envelope. A POSTCARD is itself the mail piece, so its back carries the
 * return address, indicia and recipient block.
 */
export function drawBackAlbedo(
  ctx: CanvasRenderingContext2D,
  stock: PaperStock,
  lay: FaceLayout,
  hand: string,
  rng: () => number,
): void {
  ctx.fillStyle = stock.colorHex;
  ctx.fillRect(0, 0, lay.w, lay.h);
  paintMottle(ctx, lay.w, lay.h, rng, stock.colorHex);
  paintSpeckle(ctx, lay.w, lay.h, rng, stock.colorHex, stock.mdVertical);

  if (stock.ruled) {
    drawRules(ctx, lay);
    drawMargin(ctx, lay);
  }
  drawShowThrough(ctx, stock, lay, hand);

  if (!stock.hasAddressSide) return; // a letter's back is blank

  ctx.textBaseline = 'alphabetic';

  // Return address, upper-left — printed
  ctx.fillStyle = PRINT_INK;
  ctx.globalAlpha = 0.7;
  ctx.font = `500 ${lay.returnSize}px Georgia, "Times New Roman", serif`;
  ['Rob Speciale', '128 Maple St', 'Phoenix, AZ 85004'].forEach((line, i) => {
    ctx.fillText(line, lay.returnX, lay.returnY + i * (lay.returnSize + 12));
  });
  ctx.globalAlpha = 1;

  // Indicia (postage box), upper-right
  const boxX = lay.w - lay.indiciaW - lay.indiciaMargin;
  const boxY = 76;
  ctx.strokeStyle = PRINT_INK;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 4;
  ctx.strokeRect(boxX, boxY, lay.indiciaW, lay.indiciaH);
  ctx.fillStyle = PRINT_INK;
  const mono = Math.round(lay.indiciaW / 8.7);
  ctx.font = `600 ${mono}px "Courier New", monospace`;
  ctx.fillText('FIRST-CLASS', boxX + mono, boxY + lay.indiciaH * 0.34);
  ctx.fillText('U.S. POSTAGE', boxX + mono * 0.75, boxY + lay.indiciaH * 0.56);
  ctx.fillText('PAID', boxX + lay.indiciaW * 0.35, boxY + lay.indiciaH * 0.78);
  ctx.font = `600 ${Math.round(mono * 0.8)}px "Courier New", monospace`;
  ctx.fillText('YELLOW LETTER SHOP', boxX - mono * 0.2, boxY + lay.indiciaH + 40);
  ctx.globalAlpha = 1;

  // Recipient block — handwritten, like the letter itself
  ctx.drawImage(rasterizeInkBlock(lay.w, lay.h, recipLines(lay), hand, `${stock.id}-recip`, PEN), 0, 0);
}

/** White-on-black pen-ink mask for the front (height + roughness source). */
export function drawFrontInkMask(hand: string, lay: FaceLayout, stock: PaperStock): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(lay.w, lay.h);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, lay.w, lay.h);
  // Same seed + layout as the front albedo → pixel-identical placement, so
  // the deboss sits exactly under the pen strokes.
  ctx.drawImage(rasterizeInkBlock(lay.w, lay.h, bodyLines(lay), hand, `${stock.id}-body`, '#ffffff'), 0, 0);
  return canvas;
}

/** White-on-black rules mask (lighter deboss than pen ink). */
export function drawRulesMask(stock: PaperStock, lay: FaceLayout): HTMLCanvasElement | undefined {
  if (!stock.ruled) return undefined;
  const { canvas, ctx } = makeCanvas(lay.w, lay.h);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, lay.w, lay.h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (const y of ruleYs(lay)) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(lay.w, y);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  for (const y of headerYs(lay)) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(lay.w, y);
    ctx.stroke();
  }
  marginXs(lay).forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, lay.h);
    ctx.stroke();
  });
  return canvas;
}

/**
 * White-on-black DEBOSS mask for the back: the handwritten recipient block
 * ONLY. Pen pressure embosses; the laser-printed return address and indicia
 * do not press into the sheet, so they are deliberately excluded — including
 * them (as the original did) gave printed matter pen physics.
 */
export function drawBackInkMask(hand: string, lay: FaceLayout, stock: PaperStock): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(lay.w, lay.h);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, lay.w, lay.h);
  // A letter's back has nothing written on it → no deboss.
  if (stock.hasAddressSide) {
    ctx.drawImage(rasterizeInkBlock(lay.w, lay.h, recipLines(lay), hand, `${stock.id}-recip`, '#ffffff'), 0, 0);
  }
  return canvas;
}
