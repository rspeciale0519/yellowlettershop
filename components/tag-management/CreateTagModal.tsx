"use client"

import React, { useState, useEffect } from 'react'
import { Tag, TagCategoryConfig } from '@/types/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Palette, Users, EyeOff } from 'lucide-react'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tagData: Partial<Tag>) => Promise<void>
  categories: TagCategoryConfig[]
  userId: string
  teamId?: string
  parentTag?: Tag
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const CATEGORY_COLORS: Record<string, string> = {
  system: '#10B981',
  list_management: '#3B82F6',
  demographics: '#F59E0B',
  geography: '#EF4444',
  campaign: '#8B5CF6',
  custom: '#6B7280'
}

export function CreateTagModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  userId,
  teamId,
  parentTag
}: CreateTagModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    color: '#3B82F6',
    visibility: 'public',
    sortOrder: 0
  })
  const [customColor, setCustomColor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        category: parentTag?.category || 'custom',
        color: parentTag?.color || '#3B82F6',
        visibility: 'public',
        sortOrder: 0
      })
      setCustomColor('')
      setError('')
    }
  }, [isOpen, parentTag])

  // Update color when category changes
  useEffect(() => {
    if (CATEGORY_COLORS[formData.category] && !customColor) {
      setFormData(prev => ({
        ...prev,
        color: CATEGORY_COLORS[formData.category]
      }))
    }
  }, [formData.category, customColor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Tag name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const tagData: Partial<Tag> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category as any,
        color: formData.color,
        visibility: formData.visibility as any,
        sort_order: formData.sortOrder,
        parent_tag_id: parentTag?.id,
        user_id: userId,
        team_id: teamId,
        is_system: false,
        metadata: {}
      }

      await onSubmit(tagData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }))
    setCustomColor('')
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    setFormData(prev => ({ ...prev, color }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {parentTag ? `Create Child Tag for "${parentTag.name}"` : 'Create New Tag'}
          </DialogTitle>
          <DialogDescription>
            {parentTag 
              ? `Create a tag that will be organized under "${parentTag.name}"`
              : 'Add a new tag to organize your records and data'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tag Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tag name"
                maxLength={50}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this tag is used for (optional)"
                rows={2}
                maxLength={200}
              />
            </div>
          </div>

          {/* Category Selection */}
          {!parentTag && (
            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => !cat.is_system).map(category => (
                    <SelectItem 
                      key={category.id} 
                      value={category.name.toLowerCase().replace(/\s+/g, '_')}
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color Selection */}
          <div>
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color
            </Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === color ? 'border-foreground shadow-md' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="custom-color" className="text-sm">Custom:</Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor || formData.color}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-16 h-8 p-1 cursor-pointer"
                />
                <Badge 
                  style={{ 
                    backgroundColor: formData.color, 
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Preview
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Visibility Settings */}
          <div>
            <Label>Visibility</Label>
            <RadioGroup 
              value={formData.visibility} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Team Visible</div>
                    <div className="text-sm text-muted-foreground">All team members can see and use this tag</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                  <EyeOff className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">Only you can see and use this tag</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sort Order */}
          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
              max="999"
            />
            <div className="text-sm text-muted-foreground mt-1">
              Lower numbers appear first in lists
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}