"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, X, Search } from "lucide-react"
import { format } from "date-fns"

interface SearchFilters {
  query: string
  fileType: string
  tags: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  sizeRange: {
    min?: number
    max?: number
  }
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
}

interface AdvancedSearchProps {
  isOpen: boolean
  onClose: () => void
  filters: SearchFilters
  onApplyFilters: (filters: SearchFilters) => void
  availableTags: string[]
}

const FILE_SIZE_PRESETS = [
  { label: 'Small (< 1MB)', min: 0, max: 1024 * 1024 },
  { label: 'Medium (1-10MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { label: 'Large (> 10MB)', min: 10 * 1024 * 1024, max: undefined },
]

export function AdvancedSearch({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableTags
}: AdvancedSearchProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const addTag = (tag: string) => {
    if (!localFilters.tags.includes(tag)) {
      updateFilter('tags', [...localFilters.tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    updateFilter('tags', localFilters.tags.filter(t => t !== tag))
  }

  const applySizePreset = (preset: typeof FILE_SIZE_PRESETS[0]) => {
    updateFilter('sizeRange', { min: preset.min, max: preset.max })
  }

  const handleApply = () => {
    onApplyFilters(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: '',
      fileType: 'all',
      tags: [],
      dateRange: {},
      sizeRange: {},
      sortBy: 'date',
      sortOrder: 'desc'
    }
    setLocalFilters(resetFilters)
    onApplyFilters(resetFilters)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
          <DialogDescription>
            Filter your media library with advanced search options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="Search filenames..."
                className="pl-9"
                value={localFilters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
              />
            </div>
          </div>

          {/* File Type Filter */}
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select
              value={localFilters.fileType}
              onValueChange={(value) => updateFilter('fileType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              {localFilters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0 w-4"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <Select onValueChange={addTag} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Add tags..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTags
                    .filter(tag => !localFilters.tags.includes(tag))
                    .map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Upload Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.from 
                      ? format(localFilters.dateRange.from, "PPP")
                      : "From date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.from}
                    onSelect={(date) => 
                      updateFilter('dateRange', { ...localFilters.dateRange, from: date })
                    }
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.to 
                      ? format(localFilters.dateRange.to, "PPP")
                      : "To date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.to}
                    onSelect={(date) => 
                      updateFilter('dateRange', { ...localFilters.dateRange, to: date })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear date range */}
            {(localFilters.dateRange.from || localFilters.dateRange.to) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('dateRange', {})}
              >
                Clear dates
              </Button>
            )}
          </div>

          {/* File Size Filter */}
          <div className="space-y-2">
            <Label>File Size</Label>
            <div className="space-y-2">
              {/* Size presets */}
              <div className="flex flex-wrap gap-2">
                {FILE_SIZE_PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applySizePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom range */}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min size (bytes)"
                    value={localFilters.sizeRange.min || ''}
                    onChange={(e) => 
                      updateFilter('sizeRange', {
                        ...localFilters.sizeRange,
                        min: e.target.value ? parseInt(e.target.value) : undefined
                      })
                    }
                  />
                </div>
                <span className="text-sm text-muted-foreground">to</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max size (bytes)"
                    value={localFilters.sizeRange.max || ''}
                    onChange={(e) => 
                      updateFilter('sizeRange', {
                        ...localFilters.sizeRange,
                        max: e.target.value ? parseInt(e.target.value) : undefined
                      })
                    }
                  />
                </div>
              </div>

              {/* Show current range */}
              {(localFilters.sizeRange.min || localFilters.sizeRange.max) && (
                <p className="text-sm text-muted-foreground">
                  Range: {localFilters.sizeRange.min ? formatFileSize(localFilters.sizeRange.min) : '0 Bytes'} - {' '}
                  {localFilters.sizeRange.max ? formatFileSize(localFilters.sizeRange.max) : '∞'}
                </p>
              )}

              {/* Clear size filter */}
              {(localFilters.sizeRange.min || localFilters.sizeRange.max) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('sizeRange', {})}
                >
                  Clear size filter
                </Button>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={localFilters.sortBy}
                onValueChange={(value: SearchFilters['sortBy']) => updateFilter('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Upload Date</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                  <SelectItem value="type">File Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order</Label>
              <Select
                value={localFilters.sortOrder}
                onValueChange={(value: SearchFilters['sortOrder']) => updateFilter('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}