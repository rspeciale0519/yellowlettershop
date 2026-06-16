"use client"

import { Tags } from "lucide-react"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { MERGE_FIELDS, tokenForField } from "@/components/designer/merge-fields"

export function MergeFieldsSection({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <InspectorSection title="Merge Fields" icon={Tags}>
      <div className="grid grid-cols-2 gap-2">
        {MERGE_FIELDS.map((field) => (
          <button
            key={field.key}
            type="button"
            className="rounded-md border border-input bg-background px-2 py-1.5 text-left text-xs font-medium text-foreground hover:border-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-600 dark:hover:text-yellow-300"
            onClick={() => onInsert(tokenForField(field.key))}
          >
            {field.label}
          </button>
        ))}
      </div>
    </InspectorSection>
  )
}
