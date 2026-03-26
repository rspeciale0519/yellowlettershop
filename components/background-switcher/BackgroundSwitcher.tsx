'use client'

import { useState } from 'react'
import { AmbientBackground } from '@/components/ambient-background'
import { HandwritingBackground } from '@/components/handwriting-background/HandwritingBackground'
import type { BgStyle } from '@/components/handwriting-background/HandwritingBackground.types'

interface BgOption {
  id: string
  label: string
  showAmbient: boolean
  showFragments: boolean
  bgStyle: BgStyle
}

const OPTIONS: BgOption[] = [
  { id: 'ambient',          label: 'Ambient Blobs',       showAmbient: true,  showFragments: false, bgStyle: 'none' },
  { id: 'ambient-writing',  label: 'Ambient + Writing',   showAmbient: true,  showFragments: true,  bgStyle: 'none' },
  { id: 'parchment',        label: 'Parchment + Lines',   showAmbient: false, showFragments: true,  bgStyle: 'parchment' },
  { id: 'grain',            label: 'Warm Grain',          showAmbient: false, showFragments: true,  bgStyle: 'grain' },
  { id: 'gradient',         label: 'Yellow Fade',         showAmbient: false, showFragments: true,  bgStyle: 'gradient' },
  { id: 'ruled',            label: 'Ruled Paper',         showAmbient: false, showFragments: true,  bgStyle: 'ruled' },
]

export function BackgroundSwitcher() {
  const [index, setIndex] = useState(1) // default: Ambient + Writing
  const current = OPTIONS[index]

  const prev = () => setIndex(i => (i - 1 + OPTIONS.length) % OPTIONS.length)
  const next = () => setIndex(i => (i + 1) % OPTIONS.length)

  return (
    <>
      {current.showAmbient && <AmbientBackground />}
      {current.showFragments && <HandwritingBackground bgStyle={current.bgStyle} />}

      {/* Floating background picker */}
      <div
        style={{ zIndex: 9999 }}
        className='fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-gray-700 shadow-lg ring-1 ring-gray-200 backdrop-blur-sm'
      >
        <button
          onClick={prev}
          className='px-1 text-lg leading-none hover:opacity-60 transition-opacity'
          title='Previous background'
        >
          ‹
        </button>
        <span className='min-w-[128px] text-center text-xs font-medium'>
          {current.label}
        </span>
        <button
          onClick={next}
          className='px-1 text-lg leading-none hover:opacity-60 transition-opacity'
          title='Next background'
        >
          ›
        </button>
      </div>
    </>
  )
}
