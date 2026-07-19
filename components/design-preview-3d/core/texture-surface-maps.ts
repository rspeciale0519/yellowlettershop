/**
 * LETTER INSPECTOR — procedural surface-map engine (height/normal/roughness).
 *
 * Everything here is deterministic: a seeded PRNG (mulberry32) drives all
 * randomness so a given stock always produces identical maps — screenshots
 * are reproducible across sessions. Albedo colour painters and the cut-edge
 * strips live in substrate-painters.ts.
 *
 *  - anisotropic value noise (machine-direction stretched)
 *  - height map: macro cockle + tooth + grain, minus ink deboss / plus back
 *    emboss → Sobel → tangent normal map
 *  - roughness map (ink + ruling sit smoother than bare paper tooth)
 */

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CanvasPair {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function makeCanvas(width: number, height: number): CanvasPair {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

/**
 * Value noise on an ANISOTROPIC lattice (cellX ≠ cellY stretches the grain
 * along the machine direction), bilinear-interpolated.
 */
function buildNoiseField(
  width: number,
  height: number,
  rng: () => number,
  cellX: number,
  cellY: number,
): Float32Array {
  const gw = Math.ceil(width / cellX) + 2;
  const gh = Math.ceil(height / cellY) + 2;
  const lattice = new Float32Array(gw * gh);
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = rng();
  const field = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const gy = y / cellY;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    for (let x = 0; x < width; x += 1) {
      const gx = x / cellX;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const i00 = lattice[y0 * gw + x0];
      const i10 = lattice[y0 * gw + x0 + 1];
      const i01 = lattice[(y0 + 1) * gw + x0];
      const i11 = lattice[(y0 + 1) * gw + x0 + 1];
      const top = i00 + (i10 - i00) * fx;
      const bottom = i01 + (i11 - i01) * fx;
      field[y * width + x] = top + (bottom - top) * fy;
    }
  }
  return field;
}

export interface HeightMapOptions {
  width: number;
  height: number;
  /** Grayscale canvas: white ink strokes on black (deboss source). */
  inkMask: HTMLCanvasElement;
  /** Optional rules mask (lighter deboss than pen ink). */
  rulesMask?: HTMLCanvasElement;
  /** Optional emboss mask: mirrored front ink raised on the BACK (+). */
  embossMask?: HTMLCanvasElement;
  rng: () => number;
  /** Machine direction: true = grain long vertical, false = horizontal. */
  mdVertical: boolean;
  /** Substrate tooth strength multiplier (bond 1.0 → matte board 0.4). */
  toothScale: number;
}

/**
 * Grayscale height map, three spectral bands so the surface has structure at
 * every scale the eye reads:
 *  - macro cockle (cm-scale) — the soft shading undulation between strokes;
 *  - tooth (mm-scale, MACHINE-DIRECTION stretched) — the paper "grain";
 *  - per-pixel grain (sub-mm) — the close-up tooth.
 * Then minus ink deboss (pen pressed in) and plus optional back emboss
 * (raised ridges from pen pressure showing on the address side).
 */
export function buildHeightMap(options: HeightMapOptions): HTMLCanvasElement {
  const { width, height, inkMask, rulesMask, embossMask, rng, mdVertical, toothScale } = options;
  const out = makeCanvas(width, height);
  const img = out.ctx.createImageData(width, height);

  const coarse = buildNoiseField(width, height, rng, 18, 18);
  const [fcX, fcY] = mdVertical ? [4, 15] : [15, 4];
  const fine = buildNoiseField(width, height, rng, fcX, fcY);
  const [mcX, mcY] = mdVertical ? [80, 110] : [110, 80];
  const macro = buildNoiseField(width, height, rng, mcX, mcY);
  // Per-pixel grain from a LOCAL prng so the huge draw count never desyncs the
  // shared substrate stream (deterministic per map dimensions).
  const grainRng = mulberry32((2654435761 ^ width ^ (height << 1) ^ (mdVertical ? 7 : 13)) >>> 0);

  const inkData = readLuminance(inkMask, width, height);
  const rulesData = rulesMask ? readLuminance(rulesMask, width, height) : null;
  const embossData = embossMask ? readLuminance(embossMask, width, height) : null;

  for (let i = 0; i < width * height; i += 1) {
    const tooth = ((coarse[i] - 0.5) * 6 + (fine[i] - 0.5) * 4) * toothScale;
    const cockle = (macro[i] - 0.5) * 4;
    const grain = (grainRng() - 0.5) * 3 * toothScale;
    const deboss = (inkData[i] / 255) * 35 + (rulesData ? (rulesData[i] / 255) * 6 : 0);
    const emboss = embossData ? (embossData[i] / 255) * 10 : 0;
    const v = Math.max(0, Math.min(255, Math.round(128 + tooth + cockle + grain - deboss + emboss)));
    const o = i * 4;
    img.data[o] = v;
    img.data[o + 1] = v;
    img.data[o + 2] = v;
    img.data[o + 3] = 255;
  }
  out.ctx.putImageData(img, 0, 0);
  return out.canvas;
}

function readLuminance(source: HTMLCanvasElement, width: number, height: number): Uint8ClampedArray {
  const scaled = makeCanvas(width, height);
  scaled.ctx.drawImage(source, 0, 0, width, height);
  const data = scaled.ctx.getImageData(0, 0, width, height).data;
  const lum = new Uint8ClampedArray(width * height);
  for (let i = 0; i < lum.length; i += 1) lum[i] = data[i * 4];
  return lum;
}

/**
 * Sobel-style height→tangent-space normal conversion (OpenGL convention:
 * +G = up in UV space). `strength` scales the slope response.
 */
export function heightToNormal(heightCanvas: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const width = heightCanvas.width;
  const height = heightCanvas.height;
  const src = heightCanvas.getContext('2d');
  if (!src) throw new Error('2D canvas context unavailable');
  const data = src.getImageData(0, 0, width, height).data;
  const h = (x: number, y: number): number => {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    return data[(cy * width + cx) * 4] / 255;
  };
  const out = makeCanvas(width, height);
  const img = out.ctx.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dhdu = (h(x + 1, y) - h(x - 1, y)) * 0.5 * strength;
      // v axis points up in UV space = toward smaller canvas y.
      const dhdv = (h(x, y - 1) - h(x, y + 1)) * 0.5 * strength;
      const inv = 1 / Math.sqrt(dhdu * dhdu + dhdv * dhdv + 1);
      const o = (y * width + x) * 4;
      img.data[o] = Math.round((-dhdu * inv * 0.5 + 0.5) * 255);
      img.data[o + 1] = Math.round((-dhdv * inv * 0.5 + 0.5) * 255);
      img.data[o + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      img.data[o + 3] = 255;
    }
  }
  out.ctx.putImageData(img, 0, 0);
  return out.canvas;
}

/**
 * Roughness map (grayscale): paper tooth jitter around the stock's base
 * roughness; ink strokes noticeably smoother (laid ink fills the tooth).
 * Material roughness is set to 1 so this map multiplies through directly.
 */
export function buildRoughnessMap(
  width: number,
  height: number,
  inkMask: HTMLCanvasElement,
  rng: () => number,
  baseRoughness: number,
  mdVertical: boolean,
  rulesMask?: HTMLCanvasElement,
): HTMLCanvasElement {
  const out = makeCanvas(width, height);
  const img = out.ctx.createImageData(width, height);
  const [tcX, tcY] = mdVertical ? [5, 16] : [16, 5];
  const tooth = buildNoiseField(width, height, rng, tcX, tcY);
  const inkData = readLuminance(inkMask, width, height);
  const rulesData = rulesMask ? readLuminance(rulesMask, width, height) : null;
  const base = baseRoughness * 255;
  for (let i = 0; i < width * height; i += 1) {
    const jitter = (tooth[i] - 0.5) * 16;
    const inkDrop = (inkData[i] / 255) * 40;
    // Printed ruling sits slightly smoother than bare tooth (flexo ink film).
    const ruleDrop = rulesData ? (rulesData[i] / 255) * 18 : 0;
    const v = Math.max(0, Math.min(255, Math.round(base + jitter - inkDrop - ruleDrop)));
    const o = i * 4;
    img.data[o] = v;
    img.data[o + 1] = v;
    img.data[o + 2] = v;
    img.data[o + 3] = 255;
  }
  out.ctx.putImageData(img, 0, 0);
  return out.canvas;
}
