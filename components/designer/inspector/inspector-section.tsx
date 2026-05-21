import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function InspectorSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-700/70 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-400/15 text-yellow-300">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function InspectorHeader({ subtitle, badge }: { subtitle: string; badge: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Inspector</h2>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>
        <span className="rounded-md bg-yellow-400 px-2 py-1 text-[11px] font-bold uppercase text-slate-950">
          {badge}
        </span>
      </div>
    </div>
  )
}
