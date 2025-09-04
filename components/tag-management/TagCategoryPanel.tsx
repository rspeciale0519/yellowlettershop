"use client"

import React, { useState } from 'react'
import { TagCategoryConfig } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Settings, Plus, Edit } from 'lucide-react'

interface TagCategoryPanelProps {
  categories: TagCategoryConfig[]
  onUpdate: () => void
}

interface CategoryFormData {
  name: string
  description: string
  color: string
  icon: string
}

export function TagCategoryPanel({ categories, onUpdate }: TagCategoryPanelProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TagCategoryConfig | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#6B7280',
    icon: '🏷️'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6B7280',
      icon: '🏷️'
    })
    setError('')
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (category: TagCategoryConfig) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#6B7280',
      icon: category.icon || '🏷️'
    })
    setError('')
    setEditingCategory(category)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingCategory(null)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const endpoint = editingCategory ? `/api/tag-categories/${editingCategory.id}` : '/api/tag-categories'
      const method = editingCategory ? 'PATCH' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
          icon: formData.icon
        })
      })

      if (response.ok) {
        await onUpdate()
        closeModal()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save category')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const systemCategories = categories.filter(cat => cat.is_system)
  const customCategories = categories.filter(cat => !cat.is_system)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tag Categories</h3>
          <p className="text-sm text-muted-foreground">
            Organize your tags into logical categories for better management
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* System Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Categories
          </CardTitle>
          <CardDescription>
            Built-in categories that organize system functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemCategories.map(category => (
              <div key={category.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">System</Badge>
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Sort Order: {category.sort_order}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
          <CardDescription>
            User-created categories for custom organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customCategories.map(category => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Sort Order: {category.sort_order}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No custom categories yet.</p>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || !!editingCategory} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Modify the properties of this category'
                : 'Add a new category to organize your tags'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
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
                placeholder="Describe this category (optional)"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-8 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.color}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🏷️"
                  maxLength={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}