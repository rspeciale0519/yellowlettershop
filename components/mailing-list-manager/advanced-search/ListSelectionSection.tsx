"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ListFilter, List } from "./types"

interface ListSelectionSectionProps {
  listFilter: ListFilter | null
  lists: List[]
  onSetListFilter: (filter: ListFilter | null) => void
}

export function ListSelectionSection({
  listFilter,
  lists,
  onSetListFilter,
}: ListSelectionSectionProps) {
  const handleListSelect = (listId: string) => {
    if (listFilter?.listIds.includes(listId)) {
      const newListIds = listFilter.listIds.filter((id) => id !== listId)
      if (newListIds.length === 0) {
        onSetListFilter(null)
      } else {
        onSetListFilter({
          ...listFilter,
          listIds: newListIds,
        })
      }
    } else {
      const currentListIds = listFilter?.listIds || []
      onSetListFilter({
        id: listFilter?.id || `list-${Date.now()}`,
        listIds: [...currentListIds, listId],
      })
    }
  }

  return (
    <div className="flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
      <h3 className="text-base font-semibold mb-2">Mailing List Selection</h3>
      <p className="text-sm text-muted-foreground mb-3">Choose which mailing lists to include in your search.</p>
      <div className="space-y-4">
        <div className="border rounded-md w-full">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search lists..." />
            <CommandList className="h-[200px] max-h-[200px] overflow-auto">
              <CommandEmpty>No list found.</CommandEmpty>
              <CommandGroup>
                {lists.map((list) => (
                  <CommandItem
                    key={list.id}
                    value={list.id}
                    onSelect={() => handleListSelect(list.id)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={listFilter?.listIds.includes(list.id)}
                        className="pointer-events-none"
                      />
                      <span className="truncate">
                        {list.name} ({list.recordCount})
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        {listFilter && (
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="mr-2">
              {listFilter.listIds.length} lists selected
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => onSetListFilter(null)}>
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}