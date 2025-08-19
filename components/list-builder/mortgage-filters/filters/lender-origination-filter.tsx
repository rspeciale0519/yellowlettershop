"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useCriterionUpdate } from "@/hooks/use-criterion-update"

interface LenderOriginationFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function LenderOriginationFilter({ criteria, onUpdate }: LenderOriginationFilterProps) {
  const { mergeUpdate } = useCriterionUpdate<MortgageCriteria>(onUpdate)
  const [input, setInput] = React.useState("")
  const list = criteria.lenderOrigination || []

  const add = () => {
    const name = input.trim()
    if (!name) return
    if (list.includes(name)) return setInput("")
    mergeUpdate({ lenderOrigination: [...list, name] })
    setInput("")
  }

  const removeAt = (idx: number) => {
    const next = list.filter((_, i) => i !== idx)
    mergeUpdate({ lenderOrigination: next })
  }

  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by original lender names.</p>
      <div className="flex gap-2">
        <Input
          placeholder="Add lender name"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add()
          }}
        />
        <Button onClick={add}>Add</Button>
        {list.length > 0 && (
          <Button variant="ghost" onClick={() => mergeUpdate({ lenderOrigination: [] })}>
            Clear All
          </Button>
        )}
      </div>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((name, idx) => (
            <Badge key={`${name}-${idx}`} variant="secondary" className="pr-1">
              {name}
              <button
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => removeAt(idx)}
                aria-label={`Remove ${name}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
