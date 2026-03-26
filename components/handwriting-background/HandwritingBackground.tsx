'use client'

import { useEffect, useRef, useState } from 'react'
import { useHandwritingLoop } from './useHandwritingLoop'
import { useAtramentCanvas } from './useAtramentCanvas'
import type { BgStyle } from './HandwritingBackground.types'

interface Props {
  bgStyle?: BgStyle
}

export function HandwritingBackground({ bgStyle = 'parchment' }: Props) {
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useHandwritingLoop(svgContainerRef, isMobile)
  useAtramentCanvas(canvasRef, isMobile)

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -5 }}
    >
      {/* Layer 0: Switchable paper background (light mode only, skipped when bgStyle='none') */}
      {bgStyle !== 'none' && (
        <div className={`landing-${bgStyle}`} style={{ zIndex: -1 }} />
      )}

      {/* Layer 1: Vara.js animated cursive text fragments */}
      <div
        ref={svgContainerRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />

      {/* Layer 2: Atrament mouse ink drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 1, pointerEvents: 'none', cursor: 'crosshair' }}
        role="presentation"
      />
    </div>
  )
}
