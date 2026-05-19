"use client"

import { Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { addColumn, addRow, removeColumn, removeRow, toggleHeader } from "@/components/designer/inspector/table-ops"
import { labelClass } from "@/components/designer/inspector/inspector-styles"
import type { TableDesignElement } from "@/types/designer"

export function TableInspector({
  element,
  onUpdate,
}: {
  element: TableDesignElement
  onUpdate: (updates: Partial<TableDesignElement>) => void
}) {
  return (
    <InspectorSection title="Table" icon={Table2}>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => onUpdate(addRow(element))}>
          + Row
        </Button>
        <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => onUpdate(removeRow(element))}>
          − Row
        </Button>
        <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => onUpdate(addColumn(element))}>
          + Column
        </Button>
        <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => onUpdate(removeColumn(element))}>
          − Column
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Label className={labelClass}>Header row</Label>
        <Switch
          checked={Boolean(element.headerRow)}
          onCheckedChange={() => onUpdate(toggleHeader(element))}
        />
      </div>
      <p className="text-xs text-slate-400">Double-click a cell on the canvas to edit its text.</p>
    </InspectorSection>
  )
}
