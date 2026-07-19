/**
 * LETTER INSPECTOR — paper stock catalogue for the 3D mail-piece viewer.
 *
 * Each stock now carries its REAL-WORLD FORMAT: the yellow letter and white
 * wove are portrait 8.5"×11" sheets; the heavyweight is a landscape 6"×4"
 * postcard. Scene size derives from inches × a per-stock scale (the letter
 * fills the stage at 0.14 u/in; the postcard uses 0.19 u/in so it stays
 * inspectable — each piece's own proportions are true even though the two
 * formats are not rendered at a shared scale).
 *
 * Thickness is near-real caliper (slightly exaggerated for legibility):
 * paper on screen must read as a HAIRLINE edge, not a slab — a 20lb sheet
 * is ~0.004" thick, 1/2000 of its own width. All stocks are uncoated matte
 * by owner mandate (no clearcoat anywhere; fiber sheen only).
 */

export interface PaperStock {
  id: string;
  label: string;
  /** Short caption shown under the stock name in the picker. */
  caption: string;
  /** Real-world sheet size in inches. */
  widthIn: number;
  heightIn: number;
  /** Scene units per inch for this piece. */
  unitsPerInch: number;
  /** Base paper color. */
  colorHex: string;
  /** Color of the exposed cut-edge faces of the sheet. */
  edgeHex: string;
  /** Whether the front face carries ruled lines. */
  ruled: boolean;
  /**
   * Whether the piece is itself the mail piece (a postcard) and so carries a
   * return address, mailing address and postage on its back. Letters do NOT —
   * those go on the envelope the letter is folded into.
   */
  hasAddressSide: boolean;
  /** Sheet thickness in scene units (near-real caliper at this scale). */
  thickness: number;
  /** Base PBR roughness — the roughness MAP multiplies from this value. */
  roughness: number;
  /** Fiber sheen amount (0 = none). Replaces the deleted clearcoat model. */
  sheen: number;
  /** Roughness of the sheen lobe — high = soft fiber glow, never glossy. */
  sheenRoughness: number;
  /** Warm tint of the sheen lobe (per stock). */
  sheenColorHex: string;
  /**
   * Uncoated-paper specular floor (0–1): the paper's dielectric reflection is
   * scattered away by its porous surface, so this sits well below the 1.0
   * default that reads as plastic. The specularIntensity MAP lifts ink strokes
   * to ~0.8 for a dried-ink glint; this is the paper floor.
   */
  specularIntensity: number;
  /**
   * Machine-direction fiber gloss strength (material anisotropy, 0–1). three
   * squares this in alphaT = mix(rough², 1, aniso²), so values must be high to
   * read at these roughnesses.
   */
  anisotropyStrength: number;
  /**
   * True = machine direction runs along the sheet's HEIGHT (long-grain
   * portrait letters); false = along its WIDTH (the grain-long 6×4 card).
   * Drives the anisotropy rotation and (P2) the stretched substrate noise.
   */
  mdVertical: boolean;
  /** Strength multiplier applied to the procedural normal map. */
  normalScale: number;
  /**
   * Substrate tooth strength multiplier: bond paper is toothy (1.0), the
   * matte coated card is smoother (lower). Differentiates the postcard's
   * board face from writing paper.
   */
  toothScale: number;
  /** Cut-edge treatment: fibrous paper edge, or clean die-cut board edge. */
  edgeStyle: 'fibrous' | 'diecut';
  /** Page-turn lag λ: how far the grabbed side leads the far side (0–1). */
  bendLag: number;
  /** Mid-turn lift of the sheet center, in scene units. */
  liftAmp: number;
  /** Amplitude of the baked rest-state warp (sheet is never dead flat). */
  restWarpAmp: number;
  /** Amplitude of the baked corner lift (four seeded corners). */
  cornerLift: number;
  /** Amplitude of the boundary-concentrated edge ripple (thin-sheet buckle). */
  edgeRippleAmp: number;
  /** Wavelength of the edge ripple, in scene units. */
  edgeRippleLen: number;
  /** Rest-warp shape: a full dome ('sheet') or a shallow single-axis bow ('board'). */
  warpMode: 'sheet' | 'board';
  /** Mid-turn flutter amplitude (radians of extra fold angle, gated by sin(πp)). */
  flutterAmpRad: number;
  /** Amplitude (scene units) of the landing "breath" ripple after a settle. */
  breatheAmp: number;
  /** damp() lambda used when the released page settles to a side. */
  settleLambda: number;
  /** Alpha of the baked ink show-through on the back face (0 = opaque). */
  showThroughAlpha: number;
}

/** Scene width of the sheet in units. */
export function stockSceneWidth(stock: PaperStock): number {
  return stock.widthIn * stock.unitsPerInch;
}

/** Scene height of the sheet in units. */
export function stockSceneHeight(stock: PaperStock): number {
  return stock.heightIn * stock.unitsPerInch;
}

export const PAPER_STOCKS: ReadonlyArray<PaperStock> = [
  {
    id: 'canary',
    label: 'Canary ruled',
    caption: '20lb · ruled · 8½" × 11" · the classic yellow letter',
    widthIn: 8.5,
    heightIn: 11,
    unitsPerInch: 0.14,
    colorHex: '#ecec9c',
    edgeHex: '#dcdc8a',
    ruled: true,
    hasAddressSide: false,
    thickness: 0.002,
    roughness: 0.85,
    sheen: 0.3,
    sheenRoughness: 0.9,
    sheenColorHex: '#fff3cf',
    specularIntensity: 0.3,
    anisotropyStrength: 0.5,
    mdVertical: true,
    normalScale: 0.9,
    toothScale: 1.0,
    edgeStyle: 'fibrous',
    bendLag: 0.35,
    liftAmp: 0.1,
    restWarpAmp: 0.006,
    cornerLift: 0.007,
    edgeRippleAmp: 0.0008,
    edgeRippleLen: 0.22,
    warpMode: 'sheet',
    flutterAmpRad: 0.045,
    breatheAmp: 0.008,
    settleLambda: 6.5,
    showThroughAlpha: 0.12,
  },
  {
    id: 'wove',
    label: 'White wove',
    caption: '24lb · ruled · 8½" × 11" · bright white',
    widthIn: 8.5,
    heightIn: 11,
    unitsPerInch: 0.14,
    colorHex: '#fcfcfa',
    edgeHex: '#e8e6df',
    ruled: true,
    hasAddressSide: false,
    thickness: 0.0024,
    roughness: 0.62,
    sheen: 0.2,
    sheenRoughness: 0.85,
    sheenColorHex: '#ffffff',
    specularIntensity: 0.42,
    anisotropyStrength: 0.55,
    mdVertical: true,
    normalScale: 0.6,
    toothScale: 0.7,
    edgeStyle: 'fibrous',
    bendLag: 0.22,
    liftAmp: 0.08,
    restWarpAmp: 0.004,
    cornerLift: 0.005,
    edgeRippleAmp: 0.0005,
    edgeRippleLen: 0.26,
    warpMode: 'sheet',
    flutterAmpRad: 0.03,
    breatheAmp: 0.004,
    settleLambda: 7.5,
    showThroughAlpha: 0.075,
  },
  {
    id: 'ivory',
    label: 'Heavyweight ivory',
    caption: '32pt postcard · 6" × 4" · matte',
    widthIn: 6,
    heightIn: 4,
    unitsPerInch: 0.19,
    colorHex: '#f6f1e3',
    edgeHex: '#eee7d4',
    ruled: false,
    hasAddressSide: true,
    thickness: 0.009,
    roughness: 0.55,
    sheen: 0.12,
    sheenRoughness: 0.8,
    sheenColorHex: '#f8f2e2',
    specularIntensity: 0.5,
    anisotropyStrength: 0.6,
    mdVertical: false,
    normalScale: 0.45,
    toothScale: 0.4,
    edgeStyle: 'diecut',
    bendLag: 0.05,
    liftAmp: 0.05,
    restWarpAmp: 0.0015,
    cornerLift: 0.001,
    edgeRippleAmp: 0.0003,
    edgeRippleLen: 0.3,
    warpMode: 'board',
    flutterAmpRad: 0.008,
    breatheAmp: 0.0008,
    settleLambda: 11,
    showThroughAlpha: 0,
  },
];

export const DEFAULT_STOCK_ID = PAPER_STOCKS[0].id;

export function getStockById(id: string): PaperStock {
  return PAPER_STOCKS.find((s) => s.id === id) ?? PAPER_STOCKS[0];
}
