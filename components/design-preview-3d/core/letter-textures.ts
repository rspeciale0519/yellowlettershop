'use client';

import * as React from 'react';
import * as THREE from 'three';
import type { PaperStock } from './paper-stocks';
import {
  buildHeightMap,
  buildRoughnessMap,
  hashString,
  heightToNormal,
  makeCanvas,
  mulberry32,
} from './texture-surface-maps';
import { buildEdgeTiles } from './substrate-painters';
import {
  drawBackAlbedo,
  drawBackInkMask,
  drawFrontAlbedo,
  drawFrontInkMask,
  drawRulesMask,
  handFamily,
  layoutFor,
} from './texture-face-art';

/**
 * LETTER INSPECTOR — texture orchestrator.
 *
 * Assembles the full PBR texture set for a paper stock from the two
 * drawing modules:
 *  - albedo front/back (texture-face-art: substrate variation + printing +
 *    handwriting + baked show-through)
 *  - tangent normal maps front/back (texture-surface-maps: paper-tooth
 *    height noise + ink deboss, Sobel-converted)
 *  - roughness maps front/back (ink sits smoother than paper tooth)
 *  - tiling cut-edge strip
 *
 * Everything is seeded per stock (mulberry32) — a given stock renders
 * identically every session, so verification screenshots are reproducible.
 * Canvas dimensions come from the stock's format layout (portrait letter vs
 * landscape postcard) so texture aspect always matches the sheet exactly;
 * normal/roughness maps are built at reduced resolution — surface character
 * needs far less resolution than text.
 */

export interface LetterTextures {
  front: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
  frontNormal: THREE.CanvasTexture;
  backNormal: THREE.CanvasTexture;
  frontRough: THREE.CanvasTexture;
  backRough: THREE.CanvasTexture;
  /** specularIntensity maps (alpha channel): paper floor lifted to ink glint. */
  frontSpec: THREE.CanvasTexture;
  backSpec: THREE.CanvasTexture;
  /** Cut-edge strips: `edgeAlong` for ±y faces, `edgeAcross` for ±x faces. */
  edgeAlong: THREE.CanvasTexture;
  edgeAcross: THREE.CanvasTexture;
}

function colorTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

/** Linear (non-color) data texture: normal + roughness + specular maps. */
function dataTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * specularIntensity map from an ink mask: the alpha channel (which three
 * multiplies against specularIntensity) sits at the uncoated-paper `floor`
 * everywhere, rising to ~0.8 where ink was laid — so dried ink glints at
 * raking angles while the paper stays dead matte. RGB is unused.
 */
function specularMapFromInk(ink: HTMLCanvasElement, floor: number): HTMLCanvasElement {
  const w = ink.width;
  const h = ink.height;
  const src = ink.getContext('2d');
  if (!src) throw new Error('2D canvas context unavailable');
  const inkData = src.getImageData(0, 0, w, h).data;
  const out = makeCanvas(w, h);
  const img = out.ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i += 1) {
    const lum = inkData[i * 4] / 255;
    const a = floor + lum * (0.8 - floor);
    const o = i * 4;
    img.data[o] = 255;
    img.data[o + 1] = 255;
    img.data[o + 2] = 255;
    img.data[o + 3] = Math.round(a * 255);
  }
  out.ctx.putImageData(img, 0, 0);
  return out.canvas;
}

/** Downscale a full-resolution mask canvas to map resolution. */
function toMapRes(source: HTMLCanvasElement, mapW: number, mapH: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(mapW, mapH);
  ctx.drawImage(source, 0, 0, mapW, mapH);
  return canvas;
}

/** Horizontally mirror a mask (front ink → its position seen from behind). */
function mirrorMask(source: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(source.width, source.height);
  ctx.translate(source.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/**
 * Builds the full texture set. Client-only (document access).
 * No UV mirroring on the back face: BoxGeometry lays out each face's UVs
 * to read correctly when that face is viewed from outside the box, so once
 * the piece turns 180° the address block reads right-way-round as-is.
 */
export function createLetterTextures(stock: PaperStock): LetterTextures {
  const hand = handFamily();
  const rng = mulberry32(hashString(`yls-${stock.id}`));
  const lay = layoutFor(stock);

  const frontCanvas = makeCanvas(lay.w, lay.h);
  drawFrontAlbedo(frontCanvas.ctx, stock, lay, hand, rng);

  const backCanvas = makeCanvas(lay.w, lay.h);
  drawBackAlbedo(backCanvas.ctx, stock, lay, hand, rng);

  const frontInk = toMapRes(drawFrontInkMask(hand, lay, stock), lay.mapW, lay.mapH);
  const rulesMaskFull = drawRulesMask(stock, lay);
  const rulesMask = rulesMaskFull ? toMapRes(rulesMaskFull, lay.mapW, lay.mapH) : undefined;
  const backInk = toMapRes(drawBackInkMask(hand, lay, stock), lay.mapW, lay.mapH);
  // Pen pressure raises mirrored ridges on the back of a thin sheet.
  const backEmboss = stock.showThroughAlpha > 0 ? mirrorMask(frontInk) : undefined;

  const frontHeight = buildHeightMap({
    width: lay.mapW,
    height: lay.mapH,
    inkMask: frontInk,
    rulesMask,
    rng,
    mdVertical: stock.mdVertical,
    toothScale: stock.toothScale,
  });
  const backHeight = buildHeightMap({
    width: lay.mapW,
    height: lay.mapH,
    inkMask: backInk,
    embossMask: backEmboss,
    rng,
    mdVertical: stock.mdVertical,
    toothScale: stock.toothScale,
  });

  return {
    front: colorTexture(frontCanvas.canvas),
    back: colorTexture(backCanvas.canvas),
    frontNormal: dataTexture(heightToNormal(frontHeight, 3.0)),
    backNormal: dataTexture(heightToNormal(backHeight, 3.0)),
    frontRough: dataTexture(
      buildRoughnessMap(lay.mapW, lay.mapH, frontInk, rng, stock.roughness, stock.mdVertical, rulesMask),
    ),
    backRough: dataTexture(
      buildRoughnessMap(lay.mapW, lay.mapH, backInk, rng, stock.roughness, stock.mdVertical),
    ),
    frontSpec: dataTexture(specularMapFromInk(frontInk, stock.specularIntensity)),
    backSpec: dataTexture(specularMapFromInk(backInk, stock.specularIntensity)),
    ...(() => {
      const tiles = buildEdgeTiles(stock, rng);
      const along = colorTexture(tiles.along);
      along.wrapS = THREE.RepeatWrapping;
      along.repeat.set(6, 1);
      const across = colorTexture(tiles.across);
      across.wrapT = THREE.RepeatWrapping;
      across.repeat.set(1, 6);
      return { edgeAlong: along, edgeAcross: across };
    })(),
  };
}

/** Font specs the handwriting/print passes depend on, for the load gate. */
function fontSpecs(): string[] {
  const hand = handFamily();
  return [`400 74px ${hand}`, `400 62px ${hand}`, `500 34px Georgia`];
}

/**
 * Hook wrapper: memoizes + disposes GPU texture memory on change, and gates
 * on the handwriting font actually being loaded. next/font uses display:swap,
 * so a mount-time bake can silently use a fallback sans and never rebuild —
 * `fontEpoch` bumps once `document.fonts.load` resolves, forcing exactly one
 * rebuild with the real Caveat glyphs. The prior texture set stays live until
 * that rebuild lands (useMemo swaps atomically), so there is never a blank.
 */
export function useLetterTextures(stock: PaperStock): LetterTextures {
  const [fontEpoch, setFontEpoch] = React.useState(0);
  const textures = React.useMemo(
    () => createLetterTextures(stock),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stock, fontEpoch],
  );

  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return undefined;
    const specs = fontSpecs();
    const allReady = specs.every((s) => {
      try {
        return document.fonts.check(s);
      } catch {
        return false;
      }
    });
    if (allReady) return undefined;
    let cancelled = false;
    Promise.all(specs.map((s) => document.fonts.load(s).catch(() => undefined))).then(() => {
      if (!cancelled) setFontEpoch((e) => e + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      Object.values(textures).forEach((tex) => tex.dispose());
    };
  }, [textures]);

  return textures;
}
