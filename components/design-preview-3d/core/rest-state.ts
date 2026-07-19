/**
 * LETTER INSPECTOR — rest-state baking + static warp shape. Split out of
 * page-curl.ts (LOC + concern separation). Pure math, no React.
 *
 * The rest state is the settled (flat, p=0) pose of one side of the turn,
 * baked from a PRISTINE snapshot of the box geometry. "Flat" is never dead
 * flat: a warp field (dome + second octave + four seeded corners + a
 * boundary-concentrated edge ripple, or a shallow bow for board stock) gives
 * the sheet a lived-in silhouette, and a normalized "breathe" ripple is baked
 * alongside for the landing settle (page-curl / LetterSheet drive it).
 */

import * as THREE from 'three';
import type { PaperStock } from './paper-stocks';
import type { SheetDims } from './page-curl';
import { hashString, mulberry32 } from './texture-surface-maps';

const TAU = Math.PI * 2;
const EDGE_BAND = 0.07;

export interface RestState {
  /** Flat sheet-frame coords per vertex (x, y) and normal offset h0. */
  x: Float32Array;
  y: Float32Array;
  h0: Float32Array;
  /** Rest normals (warp-perturbed). */
  nx: Float32Array;
  ny: Float32Array;
  nz: Float32Array;
  /** Normalized landing-breath ripple (drum mode + a little edge cockle). */
  rip: Float32Array;
  count: number;
}

interface CornerParam {
  sign: number;
  mag: number;
  sigma: number;
}

export interface WarpParams {
  corners: CornerParam[];
  edgePhase: number[];
  octPhase: [number, number];
}

/** Seeds the per-stock warp randomness once (deterministic per stock id). */
export function buildWarpParams(stock: PaperStock, dims: SheetDims): WarpParams {
  const rng = mulberry32(hashString(`warp-${stock.id}`));
  const minHalf = Math.min(dims.halfW, dims.halfH);
  const corners: CornerParam[] = [];
  for (let i = 0; i < 4; i += 1) {
    corners.push({
      sign: rng() < 0.5 ? -1 : 1,
      mag: 0.4 + 0.6 * rng(),
      sigma: (0.42 + 0.25 * rng()) * minHalf,
    });
  }
  const edgePhase = [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU];
  const octPhase: [number, number] = [rng() * TAU, rng() * TAU];
  return { corners, edgePhase, octPhase };
}

/** Boundary-concentrated ripple: thin-sheet buckling near the four edges. */
function edgeRipple(px: number, py: number, a: number, b: number, stock: PaperStock, p: WarpParams): number {
  const A = stock.edgeRippleAmp;
  const lam = stock.edgeRippleLen;
  const edges: ReadonlyArray<readonly [number, number, number]> = [
    [px + a, py, p.edgePhase[0]],
    [a - px, py, p.edgePhase[1]],
    [py + b, px, p.edgePhase[2]],
    [b - py, px, p.edgePhase[3]],
  ];
  let s = 0;
  for (const [d, u, ph] of edges) {
    const g = Math.exp(-((d / EDGE_BAND) * (d / EDGE_BAND)));
    s += A * g * Math.sin((TAU * u) / lam + ph);
  }
  return s;
}

/** Static warp height at a flat-sheet point. Paper is never dead flat. */
function warpAt(px: number, py: number, stock: PaperStock, dims: SheetDims, p: WarpParams): number {
  const a = dims.halfW;
  const b = dims.halfH;
  let z: number;
  if (stock.warpMode === 'board') {
    // A rigid board bows, it does not dome: a shallow single-axis arc.
    z = stock.restWarpAmp * (1 - (px / a) * (px / a)) * 0.9;
  } else {
    const base = stock.restWarpAmp * Math.sin((1.9 * px) / a + 0.6) * Math.sin((1.4 * py) / b - 0.3);
    const oct =
      0.38 * stock.restWarpAmp * Math.sin((4.6 * px) / a + p.octPhase[0]) * Math.sin((3.3 * py) / b + p.octPhase[1]);
    z = base + oct;
  }
  const corners: ReadonlyArray<readonly [number, number]> = [
    [a, -b],
    [a, b],
    [-a, b],
    [-a, -b],
  ];
  for (let i = 0; i < 4; i += 1) {
    const c = p.corners[i];
    const r = Math.hypot(px - corners[i][0], py - corners[i][1]) / c.sigma;
    z += stock.cornerLift * c.sign * c.mag * Math.exp(-r * r);
  }
  return z + edgeRipple(px, py, a, b, stock, p);
}

/** Normalized landing-breath shape: dominant drum mode + a little cockle. */
function breatheRip(px: number, py: number, a: number, b: number, stock: PaperStock, p: WarpParams): number {
  const drum = Math.cos((Math.PI * px) / (2 * a)) * Math.cos((Math.PI * py) / (2 * b));
  const cockle = stock.edgeRippleAmp > 0 ? edgeRipple(px, py, a, b, stock, p) / stock.edgeRippleAmp : 0;
  return 0.7 * drum + 0.3 * cockle;
}

/**
 * Bakes the rest state for one side of the turn from a PRISTINE snapshot of
 * the box geometry's position/normal arrays. `mirrored` produces the
 * settled-flipped frame: x → −x, offsets/normals rotated 180° about Y.
 */
export function buildRestState(
  basePos: Float32Array,
  baseNorm: Float32Array,
  count: number,
  stock: PaperStock,
  dims: SheetDims,
  mirrored: boolean,
): RestState {
  const params = buildWarpParams(stock, dims);
  const rest: RestState = {
    x: new Float32Array(count),
    y: new Float32Array(count),
    h0: new Float32Array(count),
    nx: new Float32Array(count),
    ny: new Float32Array(count),
    nz: new Float32Array(count),
    rip: new Float32Array(count),
    count,
  };
  const sign = mirrored ? -1 : 1;
  const eps = 1e-3;
  for (let i = 0; i < count; i += 1) {
    const o = i * 3;
    const bx = basePos[o];
    const by = basePos[o + 1];
    const bz = basePos[o + 2];
    const w = warpAt(bx, by, stock, dims, params);
    const zx = (warpAt(bx + eps, by, stock, dims, params) - warpAt(bx - eps, by, stock, dims, params)) / (2 * eps);
    const zy = (warpAt(bx, by + eps, stock, dims, params) - warpAt(bx, by - eps, stock, dims, params)) / (2 * eps);
    const bnx = baseNorm[o];
    const bny = baseNorm[o + 1];
    const bnz = baseNorm[o + 2];
    let wnx = bnx - zx * bnz;
    let wny = bny - zy * bnz;
    let wnz = bnz + zx * bnx + zy * bny;
    const invLen = 1 / Math.hypot(wnx, wny, wnz);
    wnx *= invLen;
    wny *= invLen;
    wnz *= invLen;

    rest.x[i] = sign * bx;
    rest.y[i] = by;
    rest.h0[i] = sign * (bz + w);
    rest.nx[i] = sign * wnx;
    rest.ny[i] = wny;
    rest.nz[i] = sign * wnz;
    rest.rip[i] = sign * breatheRip(bx, by, dims.halfW, dims.halfH, stock, params);
  }
  return rest;
}

/**
 * Writes a settled pose into the geometry, optionally displaced by the
 * landing-breath ripple (`breathe` in scene units). Normals are NOT updated
 * for the breath — the drum mode's wavelength is the whole sheet, so its
 * slope (and thus normal error) is negligible.
 */
export function applyRest(rest: RestState, geometry: THREE.BufferGeometry, breathe = 0): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const norm = geometry.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < rest.count; i += 1) {
    pos.setXYZ(i, rest.x[i], rest.y[i], rest.h0[i] + breathe * rest.rip[i]);
    norm.setXYZ(i, rest.nx[i], rest.ny[i], rest.nz[i]);
  }
  pos.needsUpdate = true;
  norm.needsUpdate = true;
}

/** Decaying landing-breath envelope (0 at t=0, damped oscillation). */
export function breatheEnvelope(tRel: number, amp: number): number {
  return amp * Math.exp(-tRel / 0.14) * Math.sin((TAU * tRel) / 0.18);
}
