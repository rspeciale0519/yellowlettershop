/**
 * LETTER INSPECTOR — albedo substrate painters. Split out of
 * texture-surface-maps.ts (LOC + concern separation): everything that paints
 * paper COLOUR variation and the cut-edge strips. The height/normal/roughness
 * math stays in texture-surface-maps.ts.
 *
 * All deterministic (seeded rng passed in). Real paper varies in HUE, not
 * just value (dye take-up follows fibre density), and its fibres run along a
 * machine direction — both are modelled here.
 */

import type { PaperStock } from './paper-stocks';
import { makeCanvas } from './texture-surface-maps';

/** Lighten (+) or darken (−) a #rrggbb hex uniformly. Returns rgb(). */
export function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function radialBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tone: string,
  alpha: number,
): void {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, tone);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * Low-frequency value mottling only: a whisper of light/dark drift so the
 * sheet is not a dead-flat vector fill. The reference stock reads clean, so
 * hue families and the sheet-scale tint gradient are deliberately omitted.
 */
export function paintMottle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
  baseHex: string,
  count = 60,
): void {
  // Clean stock: only a whisper of low-frequency value variation so the sheet
  // is not a dead-flat vector fill, well below visibility at normal distance.
  for (let i = 0; i < count; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const r = 80 + rng() * 180;
    radialBlob(ctx, x, y, r, shadeHex(baseHex, i % 2 === 0 ? -6 : 5), 0.004 + rng() * 0.004);
  }
}

/** Symmetric ~[-1,1] triangular random from the rng (poor-man's gaussian). */
function gauss(rng: () => number): number {
  return (rng() + rng() + rng() - 1.5) * 0.94;
}

/**
 * Fibre speckle: tiny dots plus hairline fibres. 70% of the hairs align to
 * the machine direction (± a small spread) so the close-up grain reads
 * directional even where material anisotropy is invisible.
 */
export function paintSpeckle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
  baseHex: string,
  mdVertical: boolean,
  dots = 1000,
  hairs = 18,
): void {
  // Sparse, very faint — the reference stock reads clean; this is barely a
  // grain hint at macro, invisible at normal distance.
  for (let i = 0; i < dots; i += 1) {
    ctx.fillStyle = shadeHex(baseHex, rng() > 0.5 ? -12 : 9);
    ctx.globalAlpha = 0.01 + rng() * 0.014;
    ctx.fillRect(rng() * width, rng() * height, 1, 1);
  }
  ctx.lineWidth = 1;
  const mdAngle = mdVertical ? Math.PI / 2 : 0;
  for (let i = 0; i < hairs; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    const len = 6 + rng() * 12;
    const angle = i < hairs * 0.7 ? mdAngle + gauss(rng) * 0.3 : rng() * Math.PI;
    ctx.strokeStyle = shadeHex(baseHex, rng() > 0.5 ? -10 : 8);
    ctx.globalAlpha = 0.012 + rng() * 0.016;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export interface EdgeTiles {
  /** Striations along the tile's long (width) axis — for ±y faces. */
  along: HTMLCanvasElement;
  /** Striations along the tile's long (height) axis — for ±x faces. */
  across: HTMLCanvasElement;
}

/**
 * Fibrous cut edge: dense short striations running ALONG the long axis, plus
 * speckle. The base tone is drawn LIGHTER than the face (raw fibre exposure
 * catches more light than the printed surface).
 */
function paintFibrousEdge(
  ctx: CanvasRenderingContext2D,
  longAxis: number,
  shortAxis: number,
  stock: PaperStock,
  rng: () => number,
  vertical: boolean,
): void {
  const put = (a: number, b: number): [number, number] => (vertical ? [b, a] : [a, b]);
  const w = vertical ? shortAxis : longAxis;
  const h = vertical ? longAxis : shortAxis;
  ctx.fillStyle = shadeHex(stock.colorHex, 7);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i += 1) {
    const a = rng() * longAxis;
    const b = rng() * shortAxis;
    const len = 8 + rng() * 30;
    ctx.strokeStyle = shadeHex(stock.colorHex, rng() > 0.5 ? -16 : 26);
    ctx.globalAlpha = 0.05 + rng() * 0.08;
    ctx.lineWidth = 0.8 + rng() * 0.8;
    ctx.beginPath();
    const [x0, y0] = put(a, b);
    const [x1, y1] = put(a + len, b + (rng() - 0.5) * 1.6);
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  for (let i = 0; i < 400; i += 1) {
    ctx.fillStyle = shadeHex(stock.colorHex, rng() > 0.5 ? -20 : 30);
    ctx.globalAlpha = 0.04 + rng() * 0.06;
    const [x, y] = put(rng() * longAxis, rng() * shortAxis);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** Clean die-cut board edge: lighter core, a couple of faint layer lines. */
function paintDiecutEdge(
  ctx: CanvasRenderingContext2D,
  longAxis: number,
  shortAxis: number,
  stock: PaperStock,
  vertical: boolean,
): void {
  const w = vertical ? shortAxis : longAxis;
  const h = vertical ? longAxis : shortAxis;
  ctx.fillStyle = shadeHex(stock.colorHex, 12);
  ctx.fillRect(0, 0, w, h);
  const lineAt = (t: number, tone: number, alpha: number): void => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = shadeHex(stock.colorHex, tone);
    if (vertical) ctx.fillRect(w * t, 0, 1.4, h);
    else ctx.fillRect(0, h * t, w, 1.4);
  };
  lineAt(0.34, 24, 0.16);
  lineAt(0.5, -8, 0.12);
  lineAt(0.68, 24, 0.16);
  ctx.globalAlpha = 1;
}

/**
 * Tiling cut-edge strips for the four side faces. ±y faces use the wide
 * "along" tile; ±x faces use the tall "across" tile so striations run along
 * every visible edge (not across the hairline thickness).
 */
export function buildEdgeTiles(stock: PaperStock, rng: () => number): EdgeTiles {
  const long = 256;
  const short = 32;
  const paint = (ctx: CanvasRenderingContext2D, vertical: boolean): void => {
    if (stock.edgeStyle === 'diecut') paintDiecutEdge(ctx, long, short, stock, vertical);
    else paintFibrousEdge(ctx, long, short, stock, rng, vertical);
  };
  const alongPair = makeCanvas(long, short);
  paint(alongPair.ctx, false);
  const acrossPair = makeCanvas(short, long);
  paint(acrossPair.ctx, true);
  return { along: alongPair.canvas, across: acrossPair.canvas };
}
