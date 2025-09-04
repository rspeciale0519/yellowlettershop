"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash } from 'lucide-react'

interface DictionaryEntry {
  search: string
  replace: string
}

interface DictionarySectionProps {
  dictionaryEnabled: boolean
  onDictionaryEnabledChange: (enabled: boolean) => void
  dictionaryEntries: DictionaryEntry[]
  onAddEntry: () => void
  onRemoveEntry: (index: number) => void
  onUpdateEntry: (index: number, field: 'search' | 'replace', value: string) => void
}

export function DictionarySection({
  dictionaryEnabled,
  onDictionaryEnabledChange,
  dictionaryEntries,
  onAddEntry,
  onRemoveEntry,
  onUpdateEntry,
}: DictionarySectionProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Dictionary</Label>
          <p className="text-sm text-muted-foreground">Define custom search and replace patterns.</p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="enable-dictionary"
            checked={dictionaryEnabled}
            onCheckedChange={(checked) => onDictionaryEnabledChange(checked === true)}
          />
          <Label htmlFor="enable-dictionary">Enable</Label>
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Search For</TableHead>
              <TableHead className="w-[200px]">Replace With</TableHead>
              <TableHead className="w-[80px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dictionaryEntries.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={entry.search}
                    onChange={(e) => onUpdateEntry(index, 'search', e.target.value)}
                    disabled={!dictionaryEnabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={entry.replace}
                    onChange={(e) => onUpdateEntry(index, 'replace', e.target.value)}
                    disabled={!dictionaryEnabled}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveEntry(index)}
                    disabled={!dictionaryEnabled}
                  >
                    <Trash className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Remove entry</span>
                  </Button>
                </TableCell>              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={onAddEntry}
        disabled={!dictionaryEnabled}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Entry
      </Button>
    </div>
  )
}