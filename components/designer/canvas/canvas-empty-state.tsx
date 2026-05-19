import { MousePointerClick } from "lucide-react"

// Shown on a blank artboard (no visible elements) to orient first-time users.
export function CanvasEmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-8">
      <div className="max-w-xs rounded-xl border border-dashed border-gray-300 bg-white/80 px-6 py-5 text-center shadow-sm backdrop-blur">
        <MousePointerClick className="mx-auto mb-2 h-6 w-6 text-gray-400" />
        <p className="text-sm font-semibold text-gray-700">Start your mail piece</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Drag a module from the left panel onto the page, or click one to add it.
          Double-click text or table cells to edit.
        </p>
      </div>
    </div>
  )
}
