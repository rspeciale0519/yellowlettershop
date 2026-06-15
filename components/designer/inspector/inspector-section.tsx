"use client"

import { useState } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function InspectorSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-lg border border-border bg-card/60 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-400/15 text-yellow-700 dark:text-yellow-300">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="flex-1 text-left text-sm font-semibold text-foreground">{title}</h3>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open ? <div className="space-y-3 px-3 pb-3">{children}</div> : null}
    </section>
  )
}

export function InspectorHeader({ subtitle, badge }: { subtitle: string; badge: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Inspector</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-md bg-yellow-400 px-2 py-1 text-[11px] font-bold uppercase text-slate-950">
          {badge}
        </span>
      </div>
    </div>
  )
}
