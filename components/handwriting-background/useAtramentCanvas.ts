'use client'

import { type RefObject, useEffect } from 'react'
import Atrament from 'atrament'
import { HANDWRITING_CONFIG } from './config'

export function useAtramentCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  isMobile: boolean,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isMobile) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const atrament = new Atrament(canvas, {
      width: window.innerWidth,
      height: window.innerHeight,
      color: HANDWRITING_CONFIG.mouseInkColor,
      weight: 2,
      smoothing: 0.85,
    })

    let isDrawing = false
    let prevX = 0
    let prevY = 0

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return
      isDrawing = true
      prevX = e.clientX
      prevY = e.clientY
      atrament.beginStroke(e.clientX, e.clientY)
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDrawing) return
      const result = atrament.draw(e.clientX, e.clientY, prevX, prevY, e.pressure || 0.5)
      prevX = result.x
      prevY = result.y
    }

    function onPointerUp(e: PointerEvent) {
      if (!isDrawing) return
      isDrawing = false
      atrament.endStroke(e.clientX, e.clientY)
    }

    function onResize() {
      const imageData = canvas
        .getContext('2d')
        ?.getImageData(0, 0, canvas.width, canvas.height)

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      if (imageData) {
        canvas.getContext('2d')?.putImageData(imageData, 0, 0)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', onResize)
      atrament.destroy()
    }
  }, [canvasRef, isMobile])
}
