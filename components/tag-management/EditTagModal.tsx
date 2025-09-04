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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Palette, Users, EyeOff, Shield, Info } from 'lucide-react'

interface EditTagModalProps {
  isOpen: boolean
  tag: Tag
  onClose: () => void
  onSubmit: (updates: Partial<Tag>) => Promise<void>
  categories: TagCategoryConfig[]
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

export function EditTagModal({
  isOpen,
  tag,
  onClose,
  onSubmit,
  categories
}: EditTagModalProps) {
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

  // Initialize form with tag data
  useEffect(() => {
    if (isOpen && tag) {
      setFormData({
        name: tag.name,
        description: tag.description || '',
        category: tag.category,
        color: tag.color,
        visibility: tag.visibility,
        sortOrder: tag.sort_order
      })
      setCustomColor('')
      setError('')
    }
  }, [isOpen, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Tag name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const updates: Partial<Tag> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        sort_order: formData.sortOrder
      }

      // Only include category and visibility if tag is not system tag
      if (!tag.is_system) {
        updates.category = formData.category as any
        updates.visibility = formData.visibility as any
      }

      await onSubmit(updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag')
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

  const hasChanges = () => {
    return (
      formData.name !== tag.name ||
      formData.description !== (tag.description || '') ||
      formData.category !== tag.category ||
      formData.color !== tag.color ||
      formData.visibility !== tag.visibility ||
      formData.sortOrder !== tag.sort_order
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tag.is_system && <Shield className="w-5 h-5 text-green-600" />}
            Edit Tag: {tag.name}
          </DialogTitle>
          <DialogDescription>
            {tag.is_system 
              ? 'System tags have limited editing options to maintain system integrity'
              : 'Modify the properties of this tag'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {tag.is_system && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                This is a system tag. Only name, description, color, and sort order can be modified.
              </AlertDescription>
            </Alert>
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

          {/* Category Selection - only for non-system tags */}
          {!tag.is_system && (
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

          {tag.is_system && (
            <div>
              <Label>Category</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Badge variant="secondary">{tag.category}</Badge>
                <span className="text-sm text-muted-foreground">(Cannot be changed for system tags)</span>
              </div>
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

          {/* Visibility Settings - only for non-system tags */}
          {!tag.is_system && (
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
          )}

          {tag.is_system && (
            <div>
              <Label>Visibility</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Shield className="w-4 h-4" />
                <Badge variant="secondary">System</Badge>
                <span className="text-sm text-muted-foreground">(Visible to all users)</span>
              </div>
            </div>
          )}

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

          {/* Show parent tag info if applicable */}
          {tag.parent_tag_id && tag.parent_tag && (
            <div className="p-3 bg-muted rounded-md">
              <Label className="text-sm font-medium">Parent Tag</Label>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.parent_tag.color }}
                />
                <span className="text-sm">{tag.parent_tag.name}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasChanges()}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}