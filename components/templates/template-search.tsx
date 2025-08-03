"use client"

import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TemplateSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TemplateSearch({ searchQuery, onSearchChange }: TemplateSearchProps) {
  const handleClear = () => {
    onSearchChange("")
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10 h-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
        aria-label="Search templates"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      )}
    </div>
  )
}
