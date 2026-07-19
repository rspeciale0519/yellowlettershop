/**
 * LETTER INSPECTOR — handwriting ink engine.
 *
 * Font-perfect repeated glyphs are the #1 "rendered text" tell at macro
 * distance. This rasterizes a handwriting block with WORD-level imperfection
 * — baseline wander, per-word rotation/scale/density, wet-start darkening,
 * capillary bleed and ink pooling — into an offscreen canvas.
 *
 * Word level, NOT per-glyph: Caveat is a joined casual hand; drawing glyphs
 * individually breaks its contextual joins. Determinism is BY CONSTRUCTION:
 * a block is rasterized ONCE per colour (pen blue for the albedo, white for
 * the deboss mask, olive for the show-through) from an engine-internal PRNG
 * seeded per (stock, block). Same seed + identical measureText advances ⇒
 * identical glyph placement across all three passes, so albedo, normal/
 * roughness masks and show-through register exactly.
 */

import { hashString, makeCanvas, mulberry32 } from './texture-surface-maps';
import { shadeHex } from './substrate-painters';

const TAU = Math.PI * 2;

export interface InkLine {
  text: string;
  /** Baseline start x, alphabetic baseline y, and font pixel size. */
  x: number;
  y: number;
  size: number;
}

/** Deposits pooled-ink dots on existing strokes (α>threshold), deterministic. */
function poolDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
  color: string,
): void {
  const data = ctx.getImageData(0, 0, width, height).data;
  ctx.fillStyle = shadeHex(color, -12);
  let placed = 0;
  for (let tries = 0; tries < 600 && placed < 70; tries += 1) {
    const x = Math.floor(rng() * width);
    const y = Math.floor(rng() * height);
    if (data[(y * width + x) * 4 + 3] > 100 && rng() < 0.28) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + rng() * 0.9, 0, TAU);
      ctx.fill();
      placed += 1;
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Rasterizes a handwriting block in one fill colour. The transparent result
 * is composited by the caller (drawImage over the albedo, or over black for a
 * mask). `seedKey` must be identical across the colour passes of the same
 * block so their glyph placement matches to the pixel.
 */
export function rasterizeInkBlock(
  width: number,
  height: number,
  lines: ReadonlyArray<InkLine>,
  hand: string,
  seedKey: string,
  color: string,
): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(width, height);
  const rng = mulberry32(hashString(`ink-${seedKey}`));
  ctx.textBaseline = 'alphabetic';

  for (const line of lines) {
    const lineSlope = (rng() - 0.5) * 0.012; // ±0.006 rad down the line
    const startX = line.x + (rng() - 0.5) * 12; // ±6 px
    const driftPhase = rng() * TAU;
    let cursor = startX;
    const words = line.text.split(' ');
    words.forEach((word, wi) => {
      ctx.font = `400 ${line.size}px ${hand}`;
      const advance = ctx.measureText(`${word} `).width;
      const scale = 0.96 + rng() * 0.09;
      const rot = (rng() - 0.5) * 0.03; // ±0.015 rad
      const baseWalk = (rng() - 0.5) * 6; // ±3 px random walk
      const drift = Math.sin((cursor - startX) / 90 + driftPhase) * 1.5; // slow travel
      const slope = (cursor - startX) * lineSlope;
      const alpha = Math.min(1, 0.82 + rng() * 0.18 + (wi === 0 ? 0.08 : 0)); // wet start
      const shift = (rng() - 0.5) * 12; // ±6 per-word ink density
      const wx = cursor + (rng() - 0.5) * 4; // ±2 px
      const wy = line.y + baseWalk + drift + slope;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(rot);
      ctx.scale(scale, scale);
      ctx.font = `400 ${line.size}px ${hand}`;
      ctx.fillStyle = shadeHex(color, shift);
      ctx.globalAlpha = alpha;
      ctx.fillText(word, 0, 0);
      // Capillary bleed: a faint offset re-draw.
      ctx.globalAlpha = alpha * 0.22;
      ctx.fillText(word, 0.7, 0.5);
      ctx.restore();
      cursor += advance;
    });
  }
  ctx.globalAlpha = 1;
  poolDots(ctx, width, height, rng, color);
  return canvas;
}
