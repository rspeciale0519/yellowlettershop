'use client'

import { type RefObject, useEffect, useRef } from 'react'
import Vara from 'vara'
import { HANDWRITING_CONFIG, VARA_FONTS, PEN_COLORS } from './config'
import { HANDWRITING_FRAGMENTS } from './fragments'

// Module-level recent history prevents immediate repetition
const recentFragments: string[] = []

function pickFragment(): string {
  const available = HANDWRITING_FRAGMENTS.filter(f => !recentFragments.includes(f))
  const pool = available.length > 0 ? available : HANDWRITING_FRAGMENTS
  const picked = pool[Math.floor(Math.random() * pool.length)]
  recentFragments.push(picked)
  if (recentFragments.length > 3) recentFragments.shift()
  return picked
}

function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

interface Rect { x: number; y: number; w: number; h: number }

const GAP = 24 // minimum pixels of breathing room between fragments

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x - GAP < b.x + b.w &&
    a.x + a.w + GAP > b.x &&
    a.y - GAP < b.y + b.h &&
    a.y + a.h + GAP > b.y
  )
}

function estimateSize(text: string, fontSize: number): { w: number; h: number } {
  return {
    w: Math.min(text.length * fontSize * 0.65, window.innerWidth * 0.7),
    h: fontSize * 2.5,
  }
}

function findPosition(w: number, h: number, active: Rect[]): { x: number; y: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = Math.random() * vw * 0.9
    const y = Math.random() * vh * 0.9
    const candidate: Rect = { x, y, w, h }
    if (!active.some(r => rectsOverlap(candidate, r))) return { x, y }
  }
  // Fallback: place anywhere
  return { x: Math.random() * vw * 0.9, y: Math.random() * vh * 0.9 }
}

export function useHandwritingLoop(
  containerRef: RefObject<HTMLDivElement | null>,
  isMobile: boolean,
) {
  const isMountedRef = useRef(false)
  const isPausedRef = useRef(false)
  const activeCountRef = useRef(0)
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const activeRectsRef = useRef<Map<string, Rect>>(new Map())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    isMountedRef.current = true
    isPausedRef.current = false
    activeCountRef.current = 0
    timerIdsRef.current = []
    activeRectsRef.current.clear()

    const maxFragments = isMobile
      ? HANDWRITING_CONFIG.mobileCap
      : HANDWRITING_CONFIG.maxConcurrentFragments

    function addTimer(id: ReturnType<typeof setTimeout>) {
      timerIdsRef.current.push(id)
    }

    function spawnFragment() {
      const el = containerRef.current
      if (!el || !isMountedRef.current || isPausedRef.current) return
      if (activeCountRef.current >= maxFragments) return

      activeCountRef.current++

      const text = pickFragment()
      const fontSize = Math.round(
        randBetween(HANDWRITING_CONFIG.minFontSize, HANDWRITING_CONFIG.maxFontSize),
      )

      const { w, h } = estimateSize(text, fontSize)
      const activeRects = Array.from(activeRectsRef.current.values())
      const { x, y } = findPosition(w, h, activeRects)

      const uniqueId = `hwf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      activeRectsRef.current.set(uniqueId, { x, y, w, h })

      const div = document.createElement('div')
      div.id = uniqueId
      div.style.position = 'absolute'
      div.style.left = `${x}px`
      div.style.top = `${y}px`
      div.style.transform = `rotate(${randBetween(-8, 8)}deg)`
      div.style.opacity = '1'
      div.style.transition = `opacity ${HANDWRITING_CONFIG.fadeDuration}ms ease-out`
      div.style.pointerEvents = 'none'
      div.style.width = `${Math.round(window.innerWidth * 0.7)}px`
      div.style.overflow = 'visible'
      el.appendChild(div)

      function onFragmentDone() {
        activeRectsRef.current.delete(uniqueId)
        activeCountRef.current = Math.max(0, activeCountRef.current - 1)
        if (div.parentNode) div.parentNode.removeChild(div)
        if (!isMountedRef.current) return
        const t = setTimeout(() => {
          if (!isPausedRef.current) spawnFragment()
        }, HANDWRITING_CONFIG.fragmentSpawnDelay)
        addTimer(t)
      }

      try {
        const randomFont = VARA_FONTS[Math.floor(Math.random() * VARA_FONTS.length)]
        const isDark = document.documentElement.classList.contains('dark')
        const randomColor = isDark
          ? 'rgba(255, 255, 255, 0.35)'
          : PEN_COLORS[Math.floor(Math.random() * PEN_COLORS.length)]
        const vara = new Vara(
          `#${uniqueId}`,
          randomFont.url,
          [
            {
              text,
              fontSize,
              strokeWidth: 2,
              color: randomColor,
              duration: HANDWRITING_CONFIG.animationDuration,
            },
          ],
        )

        // Vara sets overflow:hidden on the SVG, which clips ascenders/descenders
        const svg = div.querySelector('svg')
        if (svg) (svg as SVGElement).style.overflow = 'visible'

        vara.animationEnd(() => {
          if (!isMountedRef.current) {
            onFragmentDone()
            return
          }
          div.style.opacity = '0'
          const t = setTimeout(onFragmentDone, HANDWRITING_CONFIG.fadeDuration)
          addTimer(t)
        })
      } catch {
        onFragmentDone()
        const t = setTimeout(spawnFragment, 500)
        addTimer(t)
      }
    }

    // Initial staggered spawn
    for (let i = 0; i < maxFragments; i++) {
      const t = setTimeout(() => spawnFragment(), i * 400)
      addTimer(t)
    }

    function onVisibilityChange() {
      const wasHidden = isPausedRef.current
      isPausedRef.current = document.visibilityState === 'hidden'

      if (wasHidden && !isPausedRef.current && isMountedRef.current) {
        const needed = maxFragments - activeCountRef.current
        for (let i = 0; i < needed; i++) {
          const t = setTimeout(() => spawnFragment(), i * 400)
          addTimer(t)
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isMountedRef.current = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      timerIdsRef.current.forEach(clearTimeout)
      timerIdsRef.current = []
      activeRectsRef.current.clear()
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
  }, [containerRef, isMobile])
}
