"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface SelectedChipsProps {
  items: string[]
  onRemove: (index: number) => void
}

export function SelectedChips({ items, onRemove }: SelectedChipsProps) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((criterion, index) => (
        <Badge key={index} variant="outline" className="bg-white/50 border-yellow-300">
          {criterion}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-2 hover:bg-yellow-200"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}
