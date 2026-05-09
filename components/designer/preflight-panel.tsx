"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { CanvasSize, DesignElement } from "@/types/designer"

interface PreflightPanelProps {
  elements: DesignElement[]
  canvasSize: CanvasSize
}

function getWarnings(elements: DesignElement[], canvasSize: CanvasSize) {
  return elements.flatMap((element) => {
    const warnings: string[] = []
    const label = element.name || element.type
    if (element.hidden) warnings.push(`${label} is hidden.`)
    if (element.x < 32 || element.y < 32 || element.x + element.width > canvasSize.width - 32 || element.y + element.height > canvasSize.height - 32) {
      warnings.push(`${label} is outside the safe area.`)
    }
    if (element.type === "text" && !element.content.trim()) warnings.push(`${label} has no text.`)
    if (element.type === "text" && element.fontSize < 8) warnings.push(`${label} may be too small to print.`)
    if (element.type === "qr" && !element.value.trim()) warnings.push(`${label} needs a QR value.`)
    if (element.type === "image" && element.src.startsWith("placeholder:")) warnings.push(`${label} still uses a placeholder image.`)
    return warnings
  })
}

export function PreflightPanel({ elements, canvasSize }: PreflightPanelProps) {
  const warnings = getWarnings(elements, canvasSize)

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">Preflight</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Check common print and personalization issues.</p>
      </div>
      {warnings.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          No issues found on this page.
        </div>
      ) : (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div key={warning} className="flex gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
