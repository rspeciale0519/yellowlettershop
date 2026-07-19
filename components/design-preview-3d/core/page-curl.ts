/**
 * LETTER INSPECTOR — page-curl mathematics. Pure functions, no React.
 *
 * Model: the sheet is a developable surface bent around a moving fold line.
 * A turn is parameterized by progress p ∈ [0,1] FROM the currently settled
 * side TOWARD the other side; on completion the settled side flips and p
 * resets. Because a developable curl rotates the local surface frame by the
 * station angle φ(s), the deformed normal of ANY vertex is exactly
 * R(φ(s)) · restNormal — analytic, no computeVertexNormals.
 *
 * The grabbed side leads: station progress lags across the sheet by the
 * stock's bendLag, so a soft sheet bows deeply while a heavy card turns
 * almost rigidly. The whole profile is arc-length integrated (inextensible
 * paper) and recentered each frame; at p=0 and p=1 it is exactly flat.
 */

import * as THREE from 'three';
import type { PaperStock } from './paper-stocks';
import type { RestState } from './rest-state';

const STATIONS = 64;

/** Half-extents of the current sheet in scene units (per-stock format). */
export interface SheetDims {
  halfW: number;
  halfH: number;
}

/* ------------------------------------------------------------------ */
/* Peel direction                                                      */
/* ------------------------------------------------------------------ */

export interface PeelDirection {
  dx: number;
  dy: number;
}

/** Initial peel direction from the grab point (sheet frame). */
export function peelDirFromGrab(gx: number, gy: number): PeelDirection {
  const len = Math.hypot(gx, gy);
  if (len > 0.12) return { dx: gx / len, dy: gy / len };
  const sx = gx === 0 ? 1 : Math.sign(gx);
  return { dx: sx, dy: 0 };
}

/** Canonical end direction: pure horizontal on the grabbed half. */
export function canonicalDir(d0: PeelDirection): PeelDirection {
  const sx = d0.dx === 0 ? 1 : Math.sign(d0.dx);
  return { dx: sx, dy: 0 };
}

function smoothstep(edge0: number, edge1: number, v: number): number {
  const t = Math.min(1, Math.max(0, (v - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Untwists the peel direction toward the canonical horizontal as the turn
 * completes, so every flip lands text-upright regardless of grab corner.
 */
export function peelDirAt(d0: PeelDirection, p: number): PeelDirection {
  const dEnd = canonicalDir(d0);
  const t = smoothstep(0.35, 0.95, p);
  const dx = d0.dx + (dEnd.dx - d0.dx) * t;
  const dy = d0.dy + (dEnd.dy - d0.dy) * t;
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

/** Half-extent of the sheet along the peel direction. */
export function supportAlong(d: PeelDirection, dims: SheetDims): number {
  return dims.halfW * Math.abs(d.dx) + dims.halfH * Math.abs(d.dy);
}

/* ------------------------------------------------------------------ */
/* Curl profile                                                        */
/* ------------------------------------------------------------------ */

export interface CurlProfile {
  X: Float32Array;
  Z: Float32Array;
  sin: Float32Array;
  cos: Float32Array;
}

export function createProfile(): CurlProfile {
  return {
    X: new Float32Array(STATIONS),
    Z: new Float32Array(STATIONS),
    sin: new Float32Array(STATIONS),
    cos: new Float32Array(STATIONS),
  };
}

/** Optional mid-turn flutter: a traveling ripple in the fold angle. */
export interface Flutter {
  amp: number;
  time: number;
}

/**
 * Arc-length-integrated inextensible profile for the current frame.
 * σ=0 is the far side, σ=1 the grabbed side. Exactly flat at p=0 and p=1.
 *
 * `flutter` adds a small time-varying wave to the station angle, gated by
 * sin(πp) (zero at both endpoints, so the settled-flat guarantee holds) and
 * by σ^1.5 (quiet at the far edge, liveliest at the grabbed edge). Normals
 * stay analytic — φ still drives the sin/cos tables.
 */
export function buildProfile(
  profile: CurlProfile,
  p: number,
  support: number,
  stock: PaperStock,
  flutter?: Flutter,
): void {
  const lag = stock.bendLag;
  const lift = stock.liftAmp * Math.sin(Math.PI * p);
  const delta = (2 * support) / (STATIONS - 1);
  const flutterGate = flutter ? flutter.amp * Math.sin(Math.PI * p) : 0;

  const phiAt = (sigma: number): number => {
    const ps = Math.min(1, Math.max(0, p * (1 + lag) - lag * (1 - sigma)));
    let phi = Math.PI * ps;
    if (flutterGate !== 0) {
      phi += flutterGate * Math.sin(6.0 * (flutter as Flutter).time - 2.2 * sigma) * Math.pow(sigma, 1.5);
    }
    return phi;
  };

  let px = 0;
  let pz = 0;
  let prevPhi = phiAt(0);
  profile.X[0] = 0;
  profile.Z[0] = 0;
  profile.sin[0] = Math.sin(prevPhi);
  profile.cos[0] = Math.cos(prevPhi);
  for (let i = 1; i < STATIONS; i += 1) {
    const phi = phiAt(i / (STATIONS - 1));
    const mid = (prevPhi + phi) / 2;
    px += delta * Math.cos(mid);
    pz += delta * Math.sin(mid);
    profile.X[i] = px;
    profile.Z[i] = pz;
    profile.sin[i] = Math.sin(phi);
    profile.cos[i] = Math.cos(phi);
    prevPhi = phi;
  }

  // Recenter: the σ=0.5 station sits at (−0 offset from center, lift).
  const midIdx = (STATIONS - 1) / 2;
  const lo = Math.floor(midIdx);
  const hi = Math.ceil(midIdx);
  const midX = (profile.X[lo] + profile.X[hi]) / 2;
  const midZ = (profile.Z[lo] + profile.Z[hi]) / 2;
  for (let i = 0; i < STATIONS; i += 1) {
    profile.X[i] -= midX;
    profile.Z[i] = profile.Z[i] - midZ + lift;
  }
}

/* ------------------------------------------------------------------ */
/* Per-vertex application                                              */
/* ------------------------------------------------------------------ */

/**
 * Applies the curl to every vertex: position = t·k + X·d + Z·ẑ + h0·R_φ(ẑ),
 * normal = R_φ(n0) (Rodrigues about the fold axis k = ẑ×d).
 */
export function applyCurl(
  rest: RestState,
  geometry: THREE.BufferGeometry,
  d: PeelDirection,
  profile: CurlProfile,
  support: number,
): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const norm = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const { dx, dy } = d;
  const kx = -dy;
  const ky = dx;
  const twoS = 2 * support;
  const maxIdx = STATIONS - 1;

  for (let i = 0; i < rest.count; i += 1) {
    const x = rest.x[i];
    const y = rest.y[i];
    const s = x * dx + y * dy;
    const t = -x * dy + y * dx;
    let sigma = ((s + support) / twoS) * maxIdx;
    if (sigma < 0) sigma = 0;
    else if (sigma > maxIdx) sigma = maxIdx;
    const i0 = Math.floor(sigma);
    const i1 = i0 < maxIdx ? i0 + 1 : i0;
    const f = sigma - i0;

    const X = profile.X[i0] + (profile.X[i1] - profile.X[i0]) * f;
    const Z = profile.Z[i0] + (profile.Z[i1] - profile.Z[i0]) * f;
    const sinP = profile.sin[i0] + (profile.sin[i1] - profile.sin[i0]) * f;
    const cosP = profile.cos[i0] + (profile.cos[i1] - profile.cos[i0]) * f;

    const h0 = rest.h0[i];
    const px = t * kx + X * dx + h0 * sinP * dx;
    const py = t * ky + X * dy + h0 * sinP * dy;
    const pz = Z + h0 * cosP;
    pos.setXYZ(i, px, py, pz);

    // Rodrigues rotation of the rest normal about k by φ (k is unit, z=0).
    const nx0 = rest.nx[i];
    const ny0 = rest.ny[i];
    const nz0 = rest.nz[i];
    const kDotN = kx * nx0 + ky * ny0;
    // k × n = (ky·nz0, −kx·nz0, kx·ny0 − ky·nx0)
    const cx = ky * nz0;
    const cy = -kx * nz0;
    const cz = kx * ny0 - ky * nx0;
    const oneMinus = 1 - cosP;
    norm.setXYZ(
      i,
      nx0 * cosP + cx * sinP + kx * kDotN * oneMinus,
      ny0 * cosP + cy * sinP + ky * kDotN * oneMinus,
      nz0 * cosP + cz * sinP,
    );
  }
  pos.needsUpdate = true;
  norm.needsUpdate = true;
}

/* ------------------------------------------------------------------ */
/* Settle physics                                                      */
/* ------------------------------------------------------------------ */

/** Which side a released page should settle to, given progress + velocity. */
export function settleTarget(p: number, velocity: number): 0 | 1 {
  return p + velocity * 0.15 > 0.5 ? 1 : 0;
}
