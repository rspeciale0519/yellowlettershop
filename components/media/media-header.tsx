"use client"

import { Button } from "@/components/ui/button"
import { Grid, List, Upload } from "lucide-react"

interface MediaHeaderProps {
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  onOpenUpload: () => void
}

export function MediaHeader({ viewMode, setViewMode, onOpenUpload }: MediaHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
      <div className="flex items-center gap-2">
        <div className="flex">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={onOpenUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>
    </div>
  )
}

