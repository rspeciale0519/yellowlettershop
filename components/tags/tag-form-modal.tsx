"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { TAG_CATEGORIES, getCategoryDisplayName } from "@/lib/constants/tag-categories"

export interface TagData {
  id: string
  name: string
  description?: string
  category: string
  color: string
  visibility: 'public' | 'private' | 'system'
  sort_order: number
  user_id: string
  team_id?: string
  is_system: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#000000', // black
]

interface TagFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingTag?: TagData | null
  onSuccess?: () => void
}

export function TagFormModal({ isOpen, onClose, editingTag, onSuccess }: TagFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    color: TAG_COLORS[0],
    visibility: 'private' as 'public' | 'private' | 'system',
    sort_order: 0
  })

  useEffect(() => {
    if (editingTag) {
      setFormData({
        name: editingTag.name,
        description: editingTag.description || '',
        category: editingTag.category,
        color: editingTag.color,
        visibility: editingTag.visibility,
        sort_order: editingTag.sort_order
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        color: TAG_COLORS[0],
        visibility: 'private',
        sort_order: 0
      })
    }
  }, [editingTag])

  const handleSubmit = async () => {
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags'
      const method = editingTag ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save tag')

      toast.success(editingTag ? 'Tag updated successfully' : 'Tag created successfully')
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Error saving tag:', error)
      toast.error('Failed to save tag')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter tag name..."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this tag is used for..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {getCategoryDisplayName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={formData.visibility} onValueChange={(value: 'public' | 'private' | 'system') => setFormData(prev => ({ ...prev, visibility: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Team Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-white shadow-lg' : 'border-gray-400'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingTag ? 'Update' : 'Create'} Tag
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}