'use client';

import * as React from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { PaperStock } from './paper-stocks';
import {
  PeelDirection,
  SheetDims,
  peelDirFromGrab,
  settleTarget,
  supportAlong,
} from './page-curl';

/**
 * LETTER INSPECTOR — page-turn interaction state machine.
 *
 * The page turns FROM wherever the user grabs it: pointer-down on the sheet
 * captures the pointer, disables orbit, and derives the peel direction from
 * the local grab point. A short press (<6 px movement) is a click → full
 * animated turn from that point; a drag maps on-screen pointer travel to
 * turn progress and settles by position + velocity on release. The DOM flip
 * button drives the same machine via requestFlip (right-edge origin).
 *
 * All per-frame state lives in refs — React state never updates per frame.
 * Grabs start only from settled flat states (documented scope decision).
 */

type Mode = 'settled' | 'drag' | 'anim';

export interface PageTurnState {
  side: 0 | 1;
  p: number;
  d0: PeelDirection;
  active: boolean;
}

export interface PageTurnCallbacks {
  onFlippedChange: (flipped: boolean) => void;
  onGrabStart: () => void;
  onGrabEnd: () => void;
}

export interface PageTurnHandlers {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
  onPointerCancel: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
}

export interface PageTurnApi {
  handlers: PageTurnHandlers;
  /** Advance animation; returns true while the geometry needs re-applying. */
  tick: (delta: number) => boolean;
  read: () => PageTurnState;
  requestFlip: () => void;
  /** Reconcile with the externally-owned `flipped` prop. */
  syncFlipped: (flipped: boolean) => void;
}

interface CaptureTarget {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
}

const CLICK_SLOP_PX = 6;
const CLICK_TURN_LAMBDA = 5;

export function usePageTurn(
  stock: PaperStock,
  dims: SheetDims,
  meshRef: React.RefObject<THREE.Mesh | null>,
  callbacks: PageTurnCallbacks,
): PageTurnApi {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null;
  const gl = useThree((s) => s.gl);

  const mode = React.useRef<Mode>('settled');
  const side = React.useRef<0 | 1>(0);
  const progress = React.useRef(0);
  const target = React.useRef<0 | 1>(0);
  const lambda = React.useRef(CLICK_TURN_LAMBDA);
  const d0 = React.useRef<PeelDirection>({ dx: 1, dy: 0 });
  const velocity = React.useRef(0);
  const lastMoveT = React.useRef(0);
  const grabNdc = React.useRef(new THREE.Vector2());
  const screenDir = React.useRef(new THREE.Vector2(1, 0));
  const screenScale = React.useRef(1);
  const pGrab = React.useRef(0);
  const downClient = React.useRef(new THREE.Vector2());
  const moved = React.useRef(false);
  const pointerId = React.useRef<number | null>(null);
  const needsSettleApply = React.useRef(true);

  const cbRef = React.useRef(callbacks);
  cbRef.current = callbacks;
  const stockRef = React.useRef(stock);
  stockRef.current = stock;
  const dimsRef = React.useRef(dims);
  dimsRef.current = dims;

  /** NDC direction + scale of dragging the grabbed edge across the sheet. */
  const computeScreenMapping = React.useCallback(
    (dir: PeelDirection) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const support = supportAlong(dir, dimsRef.current);
      const origin = mesh.localToWorld(new THREE.Vector3(0, 0, 0)).project(camera);
      const tip = mesh
        .localToWorld(new THREE.Vector3(-2 * support * dir.dx, -2 * support * dir.dy, 0))
        .project(camera);
      const ex = tip.x - origin.x;
      const ey = tip.y - origin.y;
      const len = Math.hypot(ex, ey);
      if (len < 1e-4) {
        screenDir.current.set(1, 0);
        screenScale.current = 1;
        return;
      }
      screenDir.current.set(ex / len, ey / len);
      screenScale.current = 1 / len;
    },
    [camera, meshRef],
  );

  const beginAnim = React.useCallback((to: 0 | 1, animLambda: number) => {
    target.current = to;
    lambda.current = animLambda;
    mode.current = 'anim';
  }, []);

  const endGesture = React.useCallback(() => {
    if (controls) controls.enabled = true;
    gl.domElement.style.cursor = 'grab';
    cbRef.current.onGrabEnd();
  }, [controls, gl]);

  const handlers = React.useMemo<PageTurnHandlers>(
    () => ({
      onPointerDown: (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (mode.current !== 'settled') return;
        e.stopPropagation();
        const mesh = meshRef.current;
        if (!mesh) return;
        const local = mesh.worldToLocal(e.point.clone());
        d0.current = peelDirFromGrab(local.x, local.y);
        computeScreenMapping(d0.current);
        grabNdc.current.copy(e.pointer);
        pGrab.current = 0;
        progress.current = 0;
        velocity.current = 0;
        lastMoveT.current = performance.now();
        moved.current = false;
        downClient.current.set(e.nativeEvent.clientX, e.nativeEvent.clientY);
        pointerId.current = e.pointerId;
        mode.current = 'drag';
        if (controls) controls.enabled = false;
        gl.domElement.style.cursor = 'grabbing';
        cbRef.current.onGrabStart();
        (e.target as CaptureTarget).setPointerCapture?.(e.pointerId);
      },
      onPointerMove: (e) => {
        if (mode.current !== 'drag' || e.pointerId !== pointerId.current) return;
        e.stopPropagation();
        const dxN = e.pointer.x - grabNdc.current.x;
        const dyN = e.pointer.y - grabNdc.current.y;
        const along =
          (dxN * screenDir.current.x + dyN * screenDir.current.y) * screenScale.current;
        const next = Math.min(1, Math.max(0, pGrab.current + along));
        const now = performance.now();
        const dt = Math.max(1, now - lastMoveT.current) / 1000;
        const instV = (next - progress.current) / dt;
        // Clamp: burst inputs (synthetic events, frame hitches) can report
        // absurd instantaneous velocities; real gestures stay well inside.
        velocity.current = Math.max(-3, Math.min(3, velocity.current * 0.7 + instV * 0.3));
        lastMoveT.current = now;
        progress.current = next;
        if (
          Math.abs(e.nativeEvent.clientX - downClient.current.x) +
            Math.abs(e.nativeEvent.clientY - downClient.current.y) >
          CLICK_SLOP_PX
        ) {
          moved.current = true;
        }
      },
      onPointerUp: (e) => {
        if (mode.current !== 'drag' || e.pointerId !== pointerId.current) return;
        e.stopPropagation();
        (e.target as CaptureTarget).releasePointerCapture?.(e.pointerId);
        pointerId.current = null;
        endGesture();
        if (!moved.current) {
          beginAnim(1, CLICK_TURN_LAMBDA);
        } else {
          beginAnim(settleTarget(progress.current, velocity.current), stockRef.current.settleLambda);
        }
      },
      onPointerCancel: (e) => {
        if (mode.current !== 'drag' || e.pointerId !== pointerId.current) return;
        pointerId.current = null;
        endGesture();
        beginAnim(settleTarget(progress.current, velocity.current), stockRef.current.settleLambda);
      },
      onPointerOver: (e) => {
        if (mode.current === 'settled') {
          e.stopPropagation();
          gl.domElement.style.cursor = 'grab';
        }
      },
      onPointerOut: () => {
        if (mode.current !== 'drag') gl.domElement.style.cursor = '';
      },
    }),
    [beginAnim, computeScreenMapping, controls, endGesture, gl, meshRef],
  );

  const tick = React.useCallback(
    (delta: number): boolean => {
      if (mode.current === 'drag') return true;
      if (mode.current === 'anim') {
        progress.current = THREE.MathUtils.damp(
          progress.current,
          target.current,
          lambda.current,
          delta,
        );
        if (Math.abs(progress.current - target.current) < 0.002) {
          progress.current = 0;
          if (target.current === 1) {
            side.current = side.current === 0 ? 1 : 0;
            cbRef.current.onFlippedChange(side.current === 1);
          }
          mode.current = 'settled';
          needsSettleApply.current = true;
        }
        return true;
      }
      if (needsSettleApply.current) {
        needsSettleApply.current = false;
        return true;
      }
      return false;
    },
    [],
  );

  const requestFlip = React.useCallback(() => {
    if (mode.current !== 'settled') return;
    d0.current = peelDirFromGrab(dimsRef.current.halfW * 0.9, 0);
    computeScreenMapping(d0.current);
    progress.current = 0;
    beginAnim(1, CLICK_TURN_LAMBDA);
  }, [beginAnim, computeScreenMapping]);

  const syncFlipped = React.useCallback(
    (flipped: boolean) => {
      const desired: 0 | 1 = flipped ? 1 : 0;
      if (side.current !== desired && mode.current === 'settled') requestFlip();
    },
    [requestFlip],
  );

  const read = React.useCallback(
    (): PageTurnState => ({
      side: side.current,
      p: progress.current,
      d0: d0.current,
      active: mode.current !== 'settled',
    }),
    [],
  );

  return React.useMemo(
    () => ({ handlers, tick, read, requestFlip, syncFlipped }),
    [handlers, read, requestFlip, syncFlipped, tick],
  );
}
