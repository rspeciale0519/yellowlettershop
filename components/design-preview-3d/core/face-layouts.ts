/**
 * LETTER INSPECTOR — face layout data: canvas geometry + copy positions for
 * each sheet format. Portrait = the 8.5"×11" letter sheets; landscape = the
 * 6"×4" postcard. Canvas aspect matches the sheet exactly so nothing
 * stretches. Consumed by texture-face-art.ts.
 */

import type { PaperStock } from './paper-stocks';

export interface FaceLayout {
  /** Albedo canvas size (aspect matches the sheet exactly). */
  w: number;
  h: number;
  /** Normal/roughness map size (reduced resolution, same aspect). */
  mapW: number;
  mapH: number;
  marginX: number;
  ruleStartY: number;
  ruleStep: number;
  penFirst: number;
  penBody: number;
  lines: ReadonlyArray<string>;
  signIndent: number;
  returnX: number;
  returnY: number;
  returnSize: number;
  indiciaW: number;
  indiciaH: number;
  indiciaMargin: number;
  recipX: number;
  recipY: number;
  recipFirst: number;
  recipBody: number;
  recipStep: number;
}

const PORTRAIT_LAYOUT: FaceLayout = {
  w: 1088,
  h: 1408,
  mapW: 736,
  mapH: 952,
  marginX: 205,
  ruleStartY: 300,
  ruleStep: 88,
  penFirst: 74,
  penBody: 62,
  lines: [
    'Hi Maria,',
    "I'm Rob, a local buyer —",
    "I'd like to make you a fair,",
    'all-cash offer on',
    '1408 Birchwood Ln.',
    'No fees, no repairs, no rush.',
    "If you'd ever consider",
    'selling, call me at',
    '(555) 014-2288.',
    '— Rob',
  ],
  signIndent: 420,
  returnX: 80,
  returnY: 110,
  returnSize: 30,
  indiciaW: 220,
  indiciaH: 160,
  indiciaMargin: 72,
  recipX: 300,
  recipY: 680,
  recipFirst: 72,
  recipBody: 64,
  recipStep: 96,
};

const LANDSCAPE_LAYOUT: FaceLayout = {
  w: 1536,
  h: 1024,
  mapW: 1024,
  mapH: 682,
  marginX: 190,
  ruleStartY: 250,
  ruleStep: 96,
  penFirst: 84,
  penBody: 72,
  lines: [
    'Hi Maria,',
    "I'm Rob, a local buyer — I'd like to",
    'make you a fair, all-cash offer on',
    '1408 Birchwood Ln.',
    'No fees, no repairs, no rush.',
    "If you'd ever consider selling,",
    'call me at (555) 014-2288.',
    '— Rob',
  ],
  signIndent: 620,
  returnX: 96,
  returnY: 128,
  returnSize: 34,
  indiciaW: 260,
  indiciaH: 190,
  indiciaMargin: 88,
  recipX: 480,
  recipY: 520,
  recipFirst: 78,
  recipBody: 70,
  recipStep: 104,
};

export function layoutFor(stock: PaperStock): FaceLayout {
  return stock.heightIn > stock.widthIn ? PORTRAIT_LAYOUT : LANDSCAPE_LAYOUT;
}
