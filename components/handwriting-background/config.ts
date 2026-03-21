import type { HandwritingConfig } from './HandwritingBackground.types'

export const HANDWRITING_CONFIG: HandwritingConfig = {
  maxConcurrentFragments: 5,
  minFontSize: 18,
  maxFontSize: 36,
  inkColor: 'rgba(30, 58, 138, 0.18)',
  mouseInkColor: 'rgba(30, 58, 138, 0.28)',
  fadeDuration: 2000,
  fragmentSpawnDelay: 150,
  animationDuration: 3000,
  mobileCap: 2,
}

export const FONT_URL = '/fonts/Pacifico.json'
