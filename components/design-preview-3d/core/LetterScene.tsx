'use client';

import * as React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { LetterSheet } from './LetterSheet';
import type { DesignArt } from './art-textures';
import { LocalEnvironment } from './LocalEnvironment';
import { stockSceneHeight } from './paper-stocks';
import type { PaperStock } from './paper-stocks';

export interface LetterSceneProps {
  stock: PaperStock;
  flipped: boolean;
  onFlippedChange: (flipped: boolean) => void;
  /** User design art; when set, replaces the procedural sample-letter faces. */
  art?: DesignArt;
}

const SWAY_RESUME_MS = 2600;
const SWAY_AMP = 0.26; // rad ≈ 15°
const AZIMUTH_CLAMP = 0.7; // rad ≈ 40°

/**
 * Lighting rig + camera + orbit controls for the letter inspector.
 *
 * Raking three-point setup plus a local PMREM room environment (no CDN
 * fetch): the key comes in low from upper-left so paper tooth and ink
 * deboss read. No background — the canvas is transparent over the stage.
 *
 * The camera is CLAMPED to a front-facing cone and idly SWAYS within it
 * (rather than spinning a full 360°): the visible face is therefore always
 * the current flip side, so the "Flip / Show" button always matches what's
 * on screen, and the shown face is always the key-lit one (never the dark
 * away side). Grabbing the sheet or the background pauses the sway.
 */
export function LetterScene({ stock, flipped, onFlippedChange, art }: LetterSceneProps): React.ReactElement {
  const resumeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsRef = React.useRef<React.ElementRef<typeof OrbitControls>>(null);
  const [swaying, setSwaying] = React.useState(true);

  const handleStart = React.useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setSwaying(false);
  }, []);

  const handleEnd = React.useCallback(() => {
    resumeTimer.current = setTimeout(() => setSwaying(true), SWAY_RESUME_MS);
  }, []);

  React.useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  // Idle sway: ease the azimuth toward a slow sine within the front cone.
  useFrame((st, delta) => {
    const c = controlsRef.current;
    if (!c || !swaying) return;
    const target = SWAY_AMP * Math.sin(st.clock.elapsedTime * 0.32);
    c.setAzimuthalAngle(THREE.MathUtils.damp(c.getAzimuthalAngle(), target, 1.4, delta));
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.15, 3.1]} fov={32} />

      <LocalEnvironment intensity={0.55} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[-3.2, 1.9, 1.35]}
        intensity={2.2}
        color='#fffdf6'
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00006}
        shadow-normalBias={0.0035}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-camera-left={-1.7}
        shadow-camera-right={1.7}
        shadow-camera-top={1.7}
        shadow-camera-bottom={-1.7}
      />
      <directionalLight position={[2.2, -0.6, 1.4]} intensity={0.4} color='#f2ead8' />
      <directionalLight position={[0, 1, -3]} intensity={0.5} color='#ffffff' />

      <LetterSheet
        stock={stock}
        flipped={flipped}
        onFlippedChange={onFlippedChange}
        onGrabStart={handleStart}
        onGrabEnd={handleEnd}
        art={art}
      />

      <ContactShadows
        position={[0, -(stockSceneHeight(stock) / 2 + 0.07), 0]}
        opacity={0.42}
        scale={4.5}
        blur={1.7}
        far={1.1}
        resolution={512}
        frames={Infinity}
        color='#5c574b'
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={1.7}
        maxDistance={4.4}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.6}
        minAzimuthAngle={-AZIMUTH_CLAMP}
        maxAzimuthAngle={AZIMUTH_CLAMP}
        enableDamping
        dampingFactor={0.08}
        onStart={handleStart}
        onEnd={handleEnd}
      />
    </>
  );
}
