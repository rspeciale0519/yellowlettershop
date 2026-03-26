import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"

interface MediaFiltersProps {
  mediaFiles: any[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
}

export function MediaFilters({ mediaFiles, selectedTags, onTagToggle }: MediaFiltersProps) {
  // Get all unique tags from files
  const allTags = Array.from(new Set(
    mediaFiles.flatMap((file) => file.metadata?.tags || [])
  ))

  if (allTags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags:</span>
      </div>
      
      {allTags.map((tag) => (
        <Badge
          key={tag}
          variant={selectedTags.includes(tag) ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onTagToggle(tag)}
        >
          {tag}
          {selectedTags.includes(tag) && (
            <X className="h-3 w-3 ml-1" />
          )}
        </Badge>
      ))}
      
      {selectedTags.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectedTags.forEach(onTagToggle)}
        >
          Clear All
        </Button>
      )}
    </div>
  )
}