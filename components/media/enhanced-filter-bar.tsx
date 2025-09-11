"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Search, SlidersHorizontal, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserAsset } from '@/types/supabase'
import { TagManager } from "@/components/tags/tag-manager"
import { ColoredTagPills } from "@/components/tags/colored-tag-pills"


interface EnhancedFilterBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedType: string
  setSelectedType: (type: string) => void
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
  allFiles: UserAsset[]
  bulkSelectMode: boolean
  toggleBulkSelect: () => void
  selectedCount: number
  totalCount: number
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
}

export function EnhancedFilterBar({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedTags,
  setSelectedTags,
  allFiles,
  bulkSelectMode,
  toggleBulkSelect,
  selectedCount,
  totalCount,
  showAdvanced,
  setShowAdvanced
}: EnhancedFilterBarProps) {



  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedType('all')
    setSelectedTags([])
  }

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* File Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
            </SelectContent>
          </Select>

          {/* Tags Filter */}
          <TagManager
            selectedTags={selectedTags}
            onSelectedTagsChange={setSelectedTags}
            className="w-[120px]"
          />

          {/* Bulk Select Toggle */}
          <Button
            variant={bulkSelectMode ? "default" : "outline"}
            onClick={toggleBulkSelect}
            className="min-w-[110px] justify-start whitespace-nowrap"
          >
            <Users className="mr-2 h-4 w-4" />
            {bulkSelectMode ? (
              selectedCount > 0 ? `${selectedCount} selected` : 'Cancel'
            ) : 'Multi Select'}
          </Button>

          {/* Clear Filters */}
          {(searchQuery || selectedType !== 'all' || selectedTags.length > 0) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAllFilters}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Selected Tags Pills */}
      <ColoredTagPills
        selectedTags={selectedTags}
        onRemoveTag={handleRemoveTag}
      />

      {/* Results Count */}
      {(searchQuery || selectedType !== 'all' || selectedTags.length > 0) && (
        <div className="text-sm text-muted-foreground">
          Showing {totalCount} of {allFiles.length} files
        </div>
      )}
    </div>
  )
}