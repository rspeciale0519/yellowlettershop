import * as React from "react"
import { cn } from "@/lib/utils"
import { designerAccent, designerFocus, designerTransition } from "./designer-tokens"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Square icon button with branded active + focus states. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, active = false, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg [&_svg]:size-4",
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
IconButton.displayName = "IconButton"
