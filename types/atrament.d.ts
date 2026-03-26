declare module 'atrament' {
  export const MODE_DRAW: 'draw'
  export const MODE_ERASE: 'erase'
  export const MODE_FILL: 'fill'
  export const MODE_DISABLED: 'disabled'

  export type AtramentMode = 'draw' | 'erase' | 'fill' | 'disabled'

  export interface AtramentOptions {
    width?: number
    height?: number
    color?: string
    weight?: number
    smoothing?: number
    adaptiveStroke?: boolean
    secondaryMouseButton?: boolean
    ignoreModifiers?: boolean
    pressureLow?: number
    pressureHigh?: number
    pressureSmoothing?: number
  }

  export interface DrawResult {
    x: number
    y: number
  }

  export default class Atrament {
    constructor(canvas: HTMLCanvasElement | string, options?: AtramentOptions)

    beginStroke(x: number, y: number): void
    endStroke(x: number, y: number): void
    draw(x: number, y: number, prevX: number, prevY: number, pressure?: number): DrawResult
    clear(): void
    destroy(): void

    color: string
    weight: number
    smoothing: number
    adaptiveStroke: boolean
    dirty: boolean
    recordStrokes: boolean
    mode: AtramentMode

    addEventListener(event: string, handler: (data: unknown) => void): void
    removeEventListener(event: string, handler: (data: unknown) => void): void
  }
}
