"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import type { DesignElement } from "@/types/designer"

interface TextToolPanelProps {
  elements: DesignElement[]
  selectedElementId: string | null
  onSelectElement: (id: string) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
}

export function TextToolPanel({ elements, selectedElementId, onSelectElement, onUpdateElement }: TextToolPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold">Text</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Edit your text below, or click on the field you'd like to edit directly on your design.
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {elements.map((element) => (
            <div key={element.id} className="space-y-1">
              <Label htmlFor={element.id} className="text-xs uppercase text-gray-500 dark:text-gray-400">
                {element.content.substring(0, 15)}
              </Label>
              <Input
                id={element.id}
                value={element.content}
                onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                onFocus={() => onSelectElement(element.id)}
                className={
                  selectedElementId === element.id
                    ? "border-yellow-500 ring-1 ring-yellow-500"
                    : "border-gray-200 dark:border-gray-600"
                }
              />
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900">
          <Plus className="h-4 w-4 mr-2" />
          New Text Field
        </Button>
      </div>
    </div>
  )
}
