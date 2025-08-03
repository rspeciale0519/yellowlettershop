"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { SortOption, FilterOption } from "@/app/templates/page"

interface TemplateFiltersProps {
  sortBy: SortOption
  filterBy: FilterOption
  onSortChange: (sort: SortOption) => void
  onFilterChange: (filter: FilterOption) => void
}

export function TemplateFilters({ sortBy, filterBy, onSortChange, onFilterChange }: TemplateFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Sort By */}
      <div className="space-y-2">
        <Label htmlFor="sort-select" className="text-sm font-medium">
          Sort by
        </Label>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger id="sort-select" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter By */}
      <div className="space-y-2">
        <Label htmlFor="filter-select" className="text-sm font-medium">
          Filter by
        </Label>
        <Select value={filterBy} onValueChange={(value) => onFilterChange(value as FilterOption)}>
          <SelectTrigger id="filter-select" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="letter">Letters</SelectItem>
            <SelectItem value="postcard">Postcards</SelectItem>
            <SelectItem value="envelope">Envelopes</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
