"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-grow"
      />
      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
      {/* Placeholder for future advanced filters */}
    </div>
  )
}
