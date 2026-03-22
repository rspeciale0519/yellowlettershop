import type { HandwritingConfig } from './HandwritingBackground.types'

export const HANDWRITING_CONFIG: HandwritingConfig = {
  maxConcurrentFragments: 15,
  minFontSize: 12,
  maxFontSize: 18,
  inkColor: 'rgba(30, 58, 138, 0.18)',
  mouseInkColor: 'rgba(30, 58, 138, 0.28)',
  fadeDuration: 2000,
  fragmentSpawnDelay: 150,
  animationDuration: 3000,
  mobileCap: 2,
}

export const PEN_COLORS = [
  'rgba(30, 80, 160, 0.55)',  // ballpoint blue
  'rgba(30, 28, 25, 0.52)',   // ballpoint black
  'rgba(160, 30, 40, 0.55)',  // ballpoint red
] as const

export const VARA_FONTS = [
  { label: 'Pacifico',          url: '/fonts/Pacifico.json' },
  { label: 'Parisienne',        url: '/fonts/Parisienne.json' },
  { label: 'Satisfy',           url: '/fonts/SatisfySL.json' },
  { label: 'Shadows Into Light', url: '/fonts/shadows-into-light.json' },
] as const

export type VaraFontLabel = typeof VARA_FONTS[number]['label']

export const DEFAULT_FONT_URL = VARA_FONTS[0].url
