import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DESIGNER_SHORTCUTS } from "@/components/designer/designer-shortcuts"

const QUICK_START = [
  "Pick a template and mail size in the top bar.",
  "Add modules from the left panel — click, or drag onto the page.",
  "Select an element to edit it in the Inspector; set a page Background.",
  "Open Preview to proof against a real recipient, then Next to order.",
]

const LEGEND = [
  { color: "bg-red-500", label: "Bleed — art must extend here; trimmed off" },
  { color: "bg-gray-400", label: "Trim — the finished cut edge" },
  { color: "bg-emerald-500", label: "Safe — keep important content inside" },
  { color: "bg-blue-500", label: "Address zone — keep clear (USPS)" },
  { color: "bg-amber-500", label: "Indicia — postage area, keep clear" },
]

export function HelpDialogBody() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Designer help</DialogTitle>
      </DialogHeader>
      <div className="space-y-5 text-sm">
        <section>
          <h3 className="mb-2 font-semibold text-gray-900">Quick start</h3>
          <ol className="list-decimal space-y-1 pl-5 text-gray-600">
            {QUICK_START.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="mb-2 font-semibold text-gray-900">Keyboard shortcuts</h3>
          <ul className="space-y-1">
            {DESIGNER_SHORTCUTS.map((sc) => (
              <li key={sc.label} className="flex items-center justify-between gap-4">
                <span className="text-gray-600">{sc.label}</span>
                <span className="flex gap-1">
                  {sc.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 font-semibold text-gray-900">Print-zone legend</h3>
          <ul className="space-y-1.5">
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-2 text-gray-600">
                <span className={`h-3 w-3 rounded-sm ${l.color}`} />
                {l.label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
