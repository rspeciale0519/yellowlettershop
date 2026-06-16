import * as React from "react"
import { cn } from "@/lib/utils"
import { designerAccent, designerFocus, designerTransition } from "./designer-tokens"

export interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Compact button for the floating on-canvas toolbar (zoom / pan / fit / align). */
export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, active = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md [&_svg]:size-4",
        designerTransition,
        designerFocus,
        active ? designerAccent.solid : "text-muted-foreground hover:bg-muted hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  ),
)
ToolbarButton.displayName = "ToolbarButton"
