"use client"

import React, { useState, useEffect } from 'react'
import { Tag, TagCategory, TagCategoryConfig } from '@/types/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Edit, Trash2, Filter, Settings, Tag as TagIcon } from 'lucide-react'
import { CreateTagModal } from './CreateTagModal'
import { EditTagModal } from './EditTagModal'
import { TagList } from './TagList'
import { TagCategoryPanel } from './TagCategoryPanel'

interface TagManagerProps {
  userId: string
  teamId?: string
  onTagSelect?: (tag: Tag) => void
  mode?: 'management' | 'selection' | 'assignment'
  selectedTags?: string[]
  onSelectionChange?: (selectedTagIds: string[]) => void
}

export function TagManager({
  userId,
  teamId,
  onTagSelect,
  mode = 'management',
  selectedTags = [],
  onSelectionChange
}: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<TagCategoryConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [activeTab, setActiveTab] = useState('tags')

  // Load tags and categories
  useEffect(() => {
    loadData()
  }, [userId, teamId])

  // Filter tags based on search and category
  useEffect(() => {
    let filtered = tags

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tag => tag.category === selectedCategory)
    }

    setFilteredTags(filtered)
  }, [tags, searchQuery, selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load tags
      const tagsResponse = await fetch(`/api/tags?userId=${userId}&teamId=${teamId || ''}`)
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json()
        setTags(tagsData.tags || [])
      }

      // Load categories
      const categoriesResponse = await fetch('/api/tag-categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error loading tag data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (tagData: Partial<Tag>) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tagData,
          userId,
          teamId
        })
      })

      if (response.ok) {
        await loadData() // Reload tags
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const handleUpdateTag = async (tagId: string, updates: Partial<Tag>) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await loadData() // Reload tags
        setEditingTag(null)
      }
    } catch (error) {
      console.error('Error updating tag:', error)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all records.')) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData() // Reload tags
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }

  const handleTagSelection = (tagId: string) => {
    if (!onSelectionChange) return

    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId]

    onSelectionChange(newSelection)
  }

  const systemTags = filteredTags.filter(tag => tag.is_system)
  const userTags = filteredTags.filter(tag => !tag.is_system)
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name.toLowerCase().replace(/\s+/g, '_'), label: cat.name }))
  ]

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tag Management</h2>
          <p className="text-muted-foreground">
            Organize and manage your tags for better record organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Tag
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="space-y-6">
          {/* System Tags Section */}
          {systemTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Tags
                </CardTitle>
                <CardDescription>
                  System-defined tags that are always available and cannot be deleted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TagList
                  tags={systemTags}
                  mode={mode}
                  selectedTags={selectedTags}
                  onTagSelect={onTagSelect}
                  onTagSelection={handleTagSelection}
                  onEdit={setEditingTag}
                  onDelete={handleDeleteTag}
                />
              </CardContent>
            </Card>
          )}

          {/* User Tags by Category */}
          {categories.map(category => {
            const categoryTags = userTags.filter(tag => 
              tag.category === category.name.toLowerCase().replace(/\s+/g, '_')
            )
            
            if (categoryTags.length === 0 && selectedCategory === 'all') return null
            if (selectedCategory !== 'all' && selectedCategory !== category.name.toLowerCase().replace(/\s+/g, '_')) return null

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryTags.length > 0 ? (
                    <TagList
                      tags={categoryTags}
                      mode={mode}
                      selectedTags={selectedTags}
                      onTagSelect={onTagSelect}
                      onTagSelection={handleTagSelection}
                      onEdit={setEditingTag}
                      onDelete={handleDeleteTag}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tags in this category yet.</p>
                      <Button 
                        variant="link" 
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2"
                      >
                        Create your first {category.name.toLowerCase()} tag
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {filteredTags.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <TagIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No tags match your search.' : 'No tags found.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Tag
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <TagCategoryPanel categories={categories} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Tag Analytics</CardTitle>
              <CardDescription>Usage statistics and insights for your tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Analytics view coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateTagModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTag}
        categories={categories}
        userId={userId}
        teamId={teamId}
      />

      {editingTag && (
        <EditTagModal
          isOpen={true}
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSubmit={(updates) => handleUpdateTag(editingTag.id, updates)}
          categories={categories}
        />
      )}
    </div>
  )
}