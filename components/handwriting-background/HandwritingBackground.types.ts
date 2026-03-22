export type BgStyle = 'parchment' | 'grain' | 'gradient' | 'ruled' | 'none'

export interface HandwritingConfig {
  maxConcurrentFragments: number
  minFontSize: number
  maxFontSize: number
  inkColor: string
  mouseInkColor: string
  fadeDuration: number
  fragmentSpawnDelay: number
  animationDuration: number
  mobileCap: number
}
