import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { designerSurface, designerText } from "./designer-tokens"

/** Theme-coherent content-panel shell (inspector, modules, layers, ...). */
export function DesignerPanel({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-full flex-col", designerSurface.panel, className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className={designerText.title}>{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
    </div>
  )
}
