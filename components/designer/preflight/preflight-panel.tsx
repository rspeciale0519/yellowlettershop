"use client"

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { runPreflight } from "@/components/designer/preflight/preflight-rules"
import { useImageNaturalSizes } from "@/components/designer/preflight/use-image-natural-sizes"
import type { SpecRects } from "@/components/designer/mail-spec"
import type { CanvasSize, DesignElement } from "@/types/designer"

interface PreflightPanelProps {
  elements: DesignElement[]
  canvasSize?: CanvasSize
  specRects?: SpecRects
  onSelectElement?: (id: string) => void
}

export function PreflightPanel({ elements, specRects, onSelectElement }: PreflightPanelProps) {
  const naturalSizes = useImageNaturalSizes(elements)
  const issues = runPreflight(elements, { specRects, naturalSizes })
  const errors = issues.filter((i) => i.severity === "error")
  const warnings = issues.filter((i) => i.severity === "warning")

  return (
    <div className="space-y-4 bg-slate-900 p-4 text-slate-100">
      <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
        <h2 className="text-lg font-semibold text-white">Preflight</h2>
        <p className="mt-1 text-xs text-slate-400">
          Print &amp; personalization checks for this page.
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> No issues found on this page.
        </div>
      ) : (
        <div className="space-y-2">
          {[...errors, ...warnings].map((issue, index) => (
            <button
              key={`${issue.rule}-${issue.elementId ?? index}`}
              type="button"
              onClick={() => issue.elementId && onSelectElement?.(issue.elementId)}
              className={`flex w-full gap-2 rounded-md border p-3 text-left text-sm ${
                issue.severity === "error"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              {issue.severity === "error" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{issue.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
