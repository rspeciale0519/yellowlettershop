'use client';

import * as React from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Local, deterministic image-based lighting: three's procedural
 * RoomEnvironment baked through PMREM. Gives MeshPhysicalMaterial's
 * roughness/sheen response something real to reflect — the difference
 * between "colored box" and "lit object" — without drei's <Environment>,
 * which fetches HDRIs from a CDN at runtime (banned in this rig).
 *
 * Also swaps the renderer's tone mapping to Khronos PBR Neutral: r3f
 * defaults to ACES Filmic, which hue-skews the saturated brand yellow
 * toward orange and flattens the low-contrast tooth/mottle every realism
 * layer depends on. Neutral keeps sRGB brand colors invariant below the
 * shoulder. Set in useLayoutEffect (synchronous within this commit, which is
 * the same lazy chunk that attaches the sheet) so no frame renders under ACES
 * first — three does not recompile materials on a toneMapping change, so a
 * passive effect could otherwise let a sheet compile under ACES and flash.
 */
export function LocalEnvironment({ intensity = 0.5 }: { intensity?: number }): null {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  React.useLayoutEffect(() => {
    const prev = gl.toneMapping;
    const prevExposure = gl.toneMappingExposure;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    return () => {
      gl.toneMapping = prev;
      gl.toneMappingExposure = prevExposure;
    };
  }, [gl]);

  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const renderTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = renderTarget.texture;
    scene.environmentIntensity = intensity;
    pmrem.dispose();
    return () => {
      if (scene.environment === renderTarget.texture) scene.environment = null;
      renderTarget.dispose();
    };
  }, [gl, scene, intensity]);

  return null;
}
