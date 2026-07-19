'use client';

import * as React from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { stockSceneHeight, stockSceneWidth } from './paper-stocks';
import type { PaperStock } from './paper-stocks';
import { usePieceTextures } from './art-textures';
import type { DesignArt } from './art-textures';
import { applyCurl, buildProfile, createProfile, peelDirAt, supportAlong } from './page-curl';
import type { SheetDims } from './page-curl';
import { applyRest, breatheEnvelope, buildRestState } from './rest-state';
import { usePageTurn } from './use-page-turn';

const BREATHE_WINDOW = 0.45;

/**
 * Outer fraction of each half-extent that acts as the page-turn grab zone
 * (0.35 → roughly the outer 17% of the sheet on every side). Center drags
 * pass through to the camera controls.
 */
const EDGE_GRAB_FRAC = 0.35;

export interface LetterSheetProps {
  stock: PaperStock;
  flipped: boolean;
  onFlippedChange: (flipped: boolean) => void;
  onGrabStart: () => void;
  onGrabEnd: () => void;
  /** User design art; when set, replaces the procedural sample-letter faces. */
  art?: DesignArt;
}

/**
 * The mail piece as a deformable thin shell: one subdivided BoxGeometry
 * whose six material groups carry front (the handwritten letter), back (the
 * address side) and the four cut edges. The page-curl pipeline rewrites the
 * position AND normal attributes every animated frame — normals analytically
 * (the curl rotates the local frame), so PBR lighting stays exact mid-turn.
 * When settled flat, the settled pose is written once and the per-frame loop
 * does no work at all.
 */
export function LetterSheet({
  stock,
  flipped,
  onFlippedChange,
  onGrabStart,
  onGrabEnd,
  art,
}: LetterSheetProps): React.ReactElement {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const gl = useThree((s) => s.gl);
  const textures = usePieceTextures(stock, art);

  const dims = React.useMemo<SheetDims>(
    () => ({ halfW: stockSceneWidth(stock) / 2, halfH: stockSceneHeight(stock) / 2 }),
    [stock],
  );

  const geoData = React.useMemo(() => {
    const w = dims.halfW * 2;
    const h = dims.halfH * 2;
    const widthSegs = 40;
    const heightSegs = Math.max(16, Math.round((widthSegs * h) / w));
    const geo = new THREE.BoxGeometry(w, h, stock.thickness, widthSegs, heightSegs, 1);
    // Fixed generous bounds: the mid-turn profile never exceeds this radius,
    // and skipping recompute keeps raycasts cheap while vertices move.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.7);
    // Snapshot pristine positions/normals NOW, before any curl mutation, so
    // rest-state baking never reads deformed geometry (a latent landmine if
    // two stocks ever shared dims + thickness and skipped the geo rebuild).
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const basePos = Float32Array.from(posAttr.array as ArrayLike<number>);
    const baseNorm = Float32Array.from(normAttr.array as ArrayLike<number>);
    return { geometry: geo, basePos, baseNorm, count: posAttr.count };
  }, [dims, stock.thickness]);
  const geometry = geoData.geometry;

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Rest states for both settled sides (side 1 = mirrored, lies flipped).
  const restStates = React.useMemo(
    () =>
      [
        buildRestState(geoData.basePos, geoData.baseNorm, geoData.count, stock, dims, false),
        buildRestState(geoData.basePos, geoData.baseNorm, geoData.count, stock, dims, true),
      ] as const,
    [dims, geoData, stock],
  );

  const profile = React.useMemo(() => createProfile(), []);

  const turn = usePageTurn(stock, dims, meshRef, {
    onFlippedChange,
    onGrabStart,
    onGrabEnd,
  });

  // Reconcile the externally-owned flipped prop (button path).
  React.useEffect(() => {
    turn.syncFlipped(flipped);
  }, [flipped, turn]);

  // Landing-breath state (LetterSheet-local; the turn hook is untouched).
  const lastActive = React.useRef(false);
  const breatheUntil = React.useRef(0);

  // New geometry or stock: repaint the settled pose immediately.
  React.useEffect(() => {
    applyRest(restStates[turn.read().side], geometry);
    lastActive.current = false;
    breatheUntil.current = 0;
  }, [geometry, restStates, turn]);

  useFrame((st, delta) => {
    const needs = turn.tick(delta);
    const state = turn.read();
    const now = st.clock.elapsedTime;
    // A turn just settled → open the breath window.
    if (lastActive.current && !state.active && stock.breatheAmp > 0) {
      breatheUntil.current = now + BREATHE_WINDOW;
    }
    lastActive.current = state.active;
    const breathing = !state.active && breatheUntil.current > 0;
    if (!needs && !breathing) return; // fully settled: zero geometry work

    if (state.active) {
      const d = peelDirAt(state.d0, state.p);
      const support = supportAlong(d, dims);
      buildProfile(profile, state.p, support, stock, { amp: stock.flutterAmpRad, time: now });
      applyCurl(restStates[state.side], geometry, d, profile, support);
    } else if (breathing && now >= breatheUntil.current) {
      breatheUntil.current = 0;
      applyRest(restStates[state.side], geometry, 0); // final exact-flat write
    } else {
      const b = breathing ? breatheEnvelope(now - (breatheUntil.current - BREATHE_WINDOW), stock.breatheAmp) : 0;
      applyRest(restStates[state.side], geometry, b);
    }
  });

  const materials = React.useMemo(() => {
    // ±y faces (top/bottom edges) get striations running along the width;
    // ±x faces (left/right edges) get them running along the height.
    const edgeAlong = new THREE.MeshStandardMaterial({
      map: textures.edgeAlong,
      roughness: 0.95,
      metalness: 0,
    });
    const edgeAcross = new THREE.MeshStandardMaterial({
      map: textures.edgeAcross,
      roughness: 0.95,
      metalness: 0,
    });
    const shared = {
      color: new THREE.Color(1, 1, 1),
      roughness: 1, // roughnessMap multiplies from white
      sheen: stock.sheen,
      sheenRoughness: stock.sheenRoughness,
      sheenColor: new THREE.Color(stock.sheenColorHex),
      normalScale: new THREE.Vector2(stock.normalScale, stock.normalScale),
      // Uncoated paper: the specularIntensity MAP (alpha) carries the real
      // floor + ink glint, so the scalar is 1 (unity multiplier).
      specularIntensity: 1,
      // Machine-direction fiber gloss. three widens the GGX lobe along the
      // tangent; the streak we want runs PERPENDICULAR to the fibers, so the
      // rotation is 0 for long-grain (vertical MD) faces and π/2 otherwise.
      anisotropy: stock.anisotropyStrength,
      anisotropyRotation: stock.mdVertical ? 0 : Math.PI / 2,
    };
    const frontMat = new THREE.MeshPhysicalMaterial({
      ...shared,
      map: textures.front,
      normalMap: textures.frontNormal,
      roughnessMap: textures.frontRough,
      specularIntensityMap: textures.frontSpec,
    });
    const backMat = new THREE.MeshPhysicalMaterial({
      ...shared,
      map: textures.back,
      normalMap: textures.backNormal,
      roughnessMap: textures.backRough,
      specularIntensityMap: textures.backSpec,
    });
    // BoxGeometry group order: [+x, -x, +y, -y, +z(front), -z(back)].
    return [edgeAcross, edgeAcross, edgeAlong, edgeAlong, frontMat, backMat];
  }, [stock, textures]);

  React.useEffect(() => {
    return () => {
      materials.forEach((m) => m.dispose());
    };
  }, [materials]);

  // ---- Edge-band grab gating -------------------------------------------
  // A real page is turned by its EDGE. Only pointer-downs landing in the
  // outer band start a page-turn; center drags fall through to the camera
  // controls (rotate, and pan when zoomed) so users can pull the view around
  // without accidentally flipping the piece. The turn hook itself is
  // untouched — gating happens before delegation.
  const grabbing = React.useRef(false);

  const inEdgeBand = React.useCallback(
    (e: ThreeEvent<PointerEvent>): boolean => {
      const mesh = meshRef.current;
      if (!mesh) return false;
      const local = mesh.worldToLocal(e.point.clone());
      return (
        Math.abs(local.x) > dims.halfW * (1 - EDGE_GRAB_FRAC) ||
        Math.abs(local.y) > dims.halfH * (1 - EDGE_GRAB_FRAC)
      );
    },
    [dims],
  );

  const handlers = React.useMemo(
    () => ({
      onPointerDown: (e: ThreeEvent<PointerEvent>) => {
        if (!inEdgeBand(e)) return; // center drag → camera controls
        grabbing.current = true;
        turn.handlers.onPointerDown(e);
      },
      onPointerMove: (e: ThreeEvent<PointerEvent>) => {
        turn.handlers.onPointerMove(e);
        // Hover affordance: 'grab' cursor only over the turnable edge band.
        if (!grabbing.current) {
          gl.domElement.style.cursor = inEdgeBand(e) ? 'grab' : '';
        }
      },
      onPointerUp: (e: ThreeEvent<PointerEvent>) => {
        turn.handlers.onPointerUp(e);
        grabbing.current = false;
      },
      onPointerCancel: (e: ThreeEvent<PointerEvent>) => {
        turn.handlers.onPointerCancel(e);
        grabbing.current = false;
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        if (inEdgeBand(e)) turn.handlers.onPointerOver(e);
      },
      onPointerOut: turn.handlers.onPointerOut,
    }),
    [gl, inEdgeBand, turn.handlers],
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      castShadow
      receiveShadow
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onPointerOver={handlers.onPointerOver}
      onPointerOut={handlers.onPointerOut}
    />
  );
}
