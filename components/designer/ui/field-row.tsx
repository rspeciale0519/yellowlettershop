import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { designerText } from "./designer-tokens"

/** Label + control row with consistent rhythm. Evolves inspector-styles' labelClass. */
export function FieldRow({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label?: string
  htmlFor?: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={htmlFor} className={designerText.label}>
            {label}
          </label>
          {hint}
        </div>
      ) : null}
      {children}
    </div>
  )
}
