"use client"

import React from 'react'
import { Tag } from '@/types/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, Trash2, Shield, Users, Eye, EyeOff } from 'lucide-react'

interface TagListProps {
  tags: Tag[]
  mode: 'management' | 'selection' | 'assignment'
  selectedTags?: string[]
  onTagSelect?: (tag: Tag) => void
  onTagSelection?: (tagId: string) => void
  onEdit?: (tag: Tag) => void
  onDelete?: (tagId: string) => void
}

export function TagList({
  tags,
  mode,
  selectedTags = [],
  onTagSelect,
  onTagSelection,
  onEdit,
  onDelete
}: TagListProps) {
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'system':
        return <Shield className="w-3 h-3" />
      case 'public':
        return <Users className="w-3 h-3" />
      case 'private':
        return <EyeOff className="w-3 h-3" />
      default:
        return <Eye className="w-3 h-3" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'system':
        return 'System'
      case 'public':
        return 'Team Visible'
      case 'private':
        return 'Private'
      default:
        return 'Unknown'
    }
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No tags to display
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tags.map(tag => (
        <Card 
          key={tag.id} 
          className={`transition-all hover:shadow-md ${
            selectedTags.includes(tag.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                {mode === 'selection' && onTagSelection && (
                  <Checkbox
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => onTagSelection(tag.id)}
                  />
                )}
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => {
                    if (mode === 'selection' && onTagSelection) {
                      onTagSelection(tag.id)
                    } else if (onTagSelect) {
                      onTagSelect(tag)
                    }
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium truncate">{tag.name}</span>
                </div>
              </div>

              {mode === 'management' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(tag)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && !tag.is_system && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(tag.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {tag.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {tag.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {tag.category}
                </Badge>
                {tag.is_system && (
                  <Badge variant="outline" className="text-xs">
                    System
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 text-muted-foreground">
                {getVisibilityIcon(tag.visibility)}
                <span className="text-xs">{getVisibilityText(tag.visibility)}</span>
              </div>
            </div>

            {tag.parent_tag_id && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Child of: {tag.parent_tag?.name || 'Unknown'}
                </span>
              </div>
            )}

            {tag.metadata && Object.keys(tag.metadata).length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(tag.metadata).slice(0, 3).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                  {Object.keys(tag.metadata).length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{Object.keys(tag.metadata).length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}