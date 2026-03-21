'use client'

import { type RefObject, useEffect, useRef } from 'react'
import Vara from 'vara'
import { HANDWRITING_CONFIG, FONT_URL } from './config'
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

export function useHandwritingLoop(
  containerRef: RefObject<HTMLDivElement | null>,
  isMobile: boolean,
) {
  const isMountedRef = useRef(false)
  const isPausedRef = useRef(false)
  const activeCountRef = useRef(0)
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    isMountedRef.current = true
    isPausedRef.current = false
    activeCountRef.current = 0
    timerIdsRef.current = []

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

      const uniqueId = `hwf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const div = document.createElement('div')
      div.id = uniqueId
      div.style.position = 'absolute'
      div.style.left = `${randBetween(5, 72)}%`
      div.style.top = `${randBetween(10, 72)}%`
      div.style.transform = `rotate(${randBetween(-8, 8)}deg)`
      div.style.opacity = '1'
      div.style.transition = `opacity ${HANDWRITING_CONFIG.fadeDuration}ms ease-out`
      div.style.pointerEvents = 'none'
      el.appendChild(div)

      const text = pickFragment()
      const fontSize = Math.round(
        randBetween(HANDWRITING_CONFIG.minFontSize, HANDWRITING_CONFIG.maxFontSize),
      )

      function onFragmentDone() {
        activeCountRef.current = Math.max(0, activeCountRef.current - 1)
        if (div.parentNode) div.parentNode.removeChild(div)
        if (!isMountedRef.current) return
        const t = setTimeout(() => {
          if (!isPausedRef.current) spawnFragment()
        }, HANDWRITING_CONFIG.fragmentSpawnDelay)
        addTimer(t)
      }

      try {
        const vara = new Vara(
          `#${uniqueId}`,
          FONT_URL,
          [
            {
              text,
              fontSize,
              strokeWidth: 2,
              color: HANDWRITING_CONFIG.inkColor,
              duration: HANDWRITING_CONFIG.animationDuration,
            },
          ],
        )

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
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
  }, [containerRef, isMobile])
}
