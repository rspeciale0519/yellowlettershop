'use client';

import * as React from 'react';
import * as THREE from 'three';
import type { PaperStock } from './paper-stocks';
import type { LetterTextures } from './letter-textures';
import { createLetterTextures } from './letter-textures';
import {
  buildHeightMap,
  buildRoughnessMap,
  hashString,
  heightToNormal,
  makeCanvas,
  mulberry32,
} from './texture-surface-maps';
import { buildEdgeTiles } from './substrate-painters';

/**
 * ART-DRIVEN texture path for the 3D mail-piece preview.
 *
 * The procedural path (letter-textures.ts) paints a sample letter; this
 * sibling instead takes two already-rendered canvases — the user's actual
 * front/back design captured from the designer DOM — and uses them as the
 * albedo, while keeping the PAPER itself procedural (tooth normal map,
 * roughness, matte specular floor, cut edges) so the piece still reads as
 * physical paper rather than a flat billboard.
 *
 * Kept separate from createLetterTextures on purpose: the ported core stays
 * byte-diffable against new-ui-001, and art mode needs no handwriting font
 * gate, no ink deboss, no show-through.
 *
 * NOTE (from letter-textures.ts): BoxGeometry lays out each face's UVs to
 * read correctly when that face is viewed from outside the box — the BACK
 * art canvas therefore needs NO mirroring.
 */

export interface DesignArt {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
}

/** Substrate map resolution: enough for paper tooth, cheap to build. */
const MAP_PX_PER_INCH = 86;

function colorTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

function dataTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Flat specularIntensity map at the stock's uncoated-paper floor. */
function flatSpecCanvas(floor: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(4, 4);
  const img = ctx.createImageData(4, 4);
  const a = Math.round(floor * 255);
  for (let i = 0; i < 16; i += 1) {
    const o = i * 4;
    img.data[o] = 255;
    img.data[o + 1] = 255;
    img.data[o + 2] = 255;
    img.data[o + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Full texture set from user art. Substrate maps are built from the stock's
 * ORIENTED inches (not layoutFor(), which only knows the two sample-letter
 * aspects) so postcard_6x11 and friends get unstretched paper noise.
 */
export function createArtTextures(stock: PaperStock, art: DesignArt): LetterTextures {
  const rng = mulberry32(hashString(`yls-art-${stock.id}`));
  const mapW = Math.max(64, Math.round(stock.widthIn * MAP_PX_PER_INCH));
  const mapH = Math.max(64, Math.round(stock.heightIn * MAP_PX_PER_INCH));

  // No ink deboss in art mode: an all-black mask leaves pure paper tooth.
  const blankInk = makeCanvas(mapW, mapH);
  blankInk.ctx.fillStyle = '#000000';
  blankInk.ctx.fillRect(0, 0, mapW, mapH);

  const height = buildHeightMap({
    width: mapW,
    height: mapH,
    inkMask: blankInk.canvas,
    rng,
    mdVertical: stock.mdVertical,
    toothScale: stock.toothScale,
  });
  const normal = dataTexture(heightToNormal(height, 3.0));
  const rough = dataTexture(
    buildRoughnessMap(mapW, mapH, blankInk.canvas, rng, stock.roughness, stock.mdVertical),
  );
  const spec = dataTexture(flatSpecCanvas(stock.specularIntensity));

  const tiles = buildEdgeTiles(stock, rng);
  const edgeAlong = colorTexture(tiles.along);
  edgeAlong.wrapS = THREE.RepeatWrapping;
  edgeAlong.repeat.set(6, 1);
  const edgeAcross = colorTexture(tiles.across);
  edgeAcross.wrapT = THREE.RepeatWrapping;
  edgeAcross.repeat.set(1, 6);

  // Front/back share the substrate maps (same texture instance; the dispose
  // loop may hit them twice — THREE dispose is idempotent).
  return {
    front: colorTexture(art.front),
    back: colorTexture(art.back),
    frontNormal: normal,
    backNormal: normal,
    frontRough: rough,
    backRough: rough,
    frontSpec: spec,
    backSpec: spec,
    edgeAlong,
    edgeAcross,
  };
}

/**
 * Texture hook for LetterSheet: art mode when `art` is provided, otherwise
 * the procedural sample letter. (The procedural fallback here skips
 * letter-textures' handwriting-font load gate — in this app the designer
 * preview always supplies art, so the fallback only exists for completeness.)
 */
export function usePieceTextures(stock: PaperStock, art?: DesignArt): LetterTextures {
  const textures = React.useMemo(
    () => (art ? createArtTextures(stock, art) : createLetterTextures(stock)),
    [stock, art],
  );

  React.useEffect(() => {
    return () => {
      Object.values(textures).forEach((tex) => tex.dispose());
    };
  }, [textures]);

  return textures;
}
