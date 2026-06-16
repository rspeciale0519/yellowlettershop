"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { designerAccent, designerFocus, designerText } from "./designer-tokens"

/** Collapsible, theme-coherent section. Evolves the old InspectorSection. */
export function PanelSection({
  title,
  icon: Icon,
  defaultOpen = true,
  collapsible = true,
  badge,
  children,
}: {
  title: string
  icon?: LucideIcon
  defaultOpen?: boolean
  collapsible?: boolean
  badge?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = collapsible ? open : true

  return (
    <section className="rounded-xl border border-border bg-card/60 shadow-sm">
      <button
        type="button"
        onClick={() => (collapsible ? setOpen((v) => !v) : undefined)}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5",
          designerFocus,
          collapsible ? "cursor-pointer" : "cursor-default",
        )}
      >
        {Icon ? (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", designerAccent.soft)}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <h3 className={cn(designerText.title, "flex-1 text-left")}>{title}</h3>
        {badge}
        {collapsible ? (
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen ? "" : "-rotate-90")}
          />
        ) : null}
      </button>
      {isOpen ? <div className="space-y-3 px-3 pb-3">{children}</div> : null}
    </section>
  )
}
