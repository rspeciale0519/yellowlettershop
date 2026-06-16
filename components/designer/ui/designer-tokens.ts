// Designer design-system tokens — theme-aware class constants.
//
// Content surfaces use the app's shadcn semantic tokens (bg-card / bg-background /
// border-border / text-muted-foreground / ...) so they flip automatically between
// light and dark — this is what makes the designer theme-coherent. The brand icon
// rail is a fixed dark surface in BOTH themes for identity. Brand accent = yellow-400.
//
// Import these instead of hardcoding slate-9xx so a surface is never dark-only again.

/** Surfaces. `rail` is intentionally fixed-dark in both themes (brand). */
export const designerSurface = {
  panel: "bg-card text-card-foreground",
  inset: "bg-muted/50",
  rail: "bg-slate-950 text-slate-300",
  canvas: "bg-muted/60 dark:bg-slate-900",
} as const

export const designerBorder = {
  base: "border-border",
  subtle: "border-border/60",
  rail: "border-slate-800",
} as const

export const designerText = {
  title: "text-sm font-semibold text-foreground",
  label: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
  muted: "text-xs text-muted-foreground",
  value: "text-sm text-foreground tabular-nums",
} as const

/** Brand accent. `solid` is the selected/active state, consistent in both themes. */
export const designerAccent = {
  solid: "bg-yellow-400 text-slate-950",
  soft: "bg-yellow-400/15 text-yellow-700 dark:text-yellow-300",
} as const

/** One shared focus-ring recipe applied to every interactive designer surface. */
export const designerFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export const designerTransition = "transition-colors duration-150"

export const designerRadius = {
  panel: "rounded-xl",
  control: "rounded-lg",
  chip: "rounded-md",
} as const

export const designerShadow = {
  panel: "shadow-sm",
  float: "shadow-lg shadow-slate-900/10 dark:shadow-black/40",
} as const

/** Standard text/number input surface (theme-coherent, branded focus ring). */
export const designerControl =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground " +
  designerTransition +
  " " +
  designerFocus
