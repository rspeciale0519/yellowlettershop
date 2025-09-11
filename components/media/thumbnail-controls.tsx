"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings2, Grid3x3, Grid2x2, LayoutGrid } from "lucide-react"

export type ThumbnailSize = 'small' | 'medium' | 'large'

interface ThumbnailControlsProps {
  currentSize: ThumbnailSize
  onSizeChange: (size: ThumbnailSize) => void
}

const THUMBNAIL_OPTIONS = [
  {
    size: 'small' as ThumbnailSize,
    label: 'Small',
    icon: Grid3x3,
    gridClass: 'grid-cols-4 lg:grid-cols-6',
    imageClass: 'aspect-square',
    description: '6 per row (desktop)'
  },
  {
    size: 'medium' as ThumbnailSize,
    label: 'Medium',
    icon: Grid2x2,
    gridClass: 'grid-cols-3 lg:grid-cols-4',
    imageClass: 'aspect-[4/3]',
    description: '4 per row (desktop)'
  },
  {
    size: 'large' as ThumbnailSize,
    label: 'Large',
    icon: LayoutGrid,
    gridClass: 'grid-cols-2 lg:grid-cols-3',
    imageClass: 'aspect-[3/2]',
    description: '3 per row (desktop)'
  }
]

export function ThumbnailControls({ currentSize, onSizeChange }: ThumbnailControlsProps) {
  const currentOption = THUMBNAIL_OPTIONS.find(opt => opt.size === currentSize) || THUMBNAIL_OPTIONS[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <currentOption.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THUMBNAIL_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.size}
            onClick={() => onSizeChange(option.size)}
            className={currentSize === option.size ? 'bg-accent' : ''}
          >
            <option.icon className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export grid classes for use in components
export function getThumbnailGridClass(size: ThumbnailSize): string {
  const option = THUMBNAIL_OPTIONS.find(opt => opt.size === size)
  return option?.gridClass || THUMBNAIL_OPTIONS[1].gridClass
}

export function getThumbnailImageClass(size: ThumbnailSize): string {
  const option = THUMBNAIL_OPTIONS.find(opt => opt.size === size)
  return option?.imageClass || THUMBNAIL_OPTIONS[1].imageClass
}