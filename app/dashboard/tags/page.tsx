"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Tag,
  Palette,
  Users,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TagFormModal, TagData } from "@/components/tags/tag-form-modal"
import { TagDeleteModal } from "@/components/tags/tag-delete-modal"
import { TAG_CATEGORIES, getCategoryDisplayName } from "@/lib/constants/tag-categories"

interface TagWithStats extends TagData {
  count: number
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithStats[]>([])
  const [filteredTags, setFilteredTags] = useState<TagWithStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagData | null>(null)
  const [tagToDelete, setTagToDelete] = useState<TagData | null>(null)

  const fetchTags = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tags/stats`)
      if (!response.ok) throw new Error('Failed to fetch tags')
      
      const data = await response.json()
      setTags(data.stats || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Filter tags based on search and category
  useEffect(() => {
    let filtered = tags
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(query) ||
        tag.description?.toLowerCase().includes(query) ||
        tag.category.toLowerCase().includes(query)
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tag => tag.category === selectedCategory)
    }
    
    setFilteredTags(filtered)
  }, [tags, searchQuery, selectedCategory])

  const handleCreateTag = () => {
    setEditingTag(null)
    setCreateModalOpen(true)
  }

  const handleEditTag = (tag: TagData) => {
    setEditingTag(tag)
    setEditModalOpen(true)
  }

  const handleDeleteTag = (tag: TagData) => {
    setTagToDelete(tag)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!tagToDelete) return

    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete tag')

      toast.success('Tag deleted successfully')
      setDeleteModalOpen(false)
      setTagToDelete(null)
      fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    }
  }

  const handleModalSuccess = () => {
    fetchTags()
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Eye className="h-4 w-4 text-green-600" />
      case 'private':
        return <EyeOff className="h-4 w-4 text-yellow-600" />
      case 'system':
        return <Tag className="h-4 w-4 text-blue-600" />
      default:
        return <EyeOff className="h-4 w-4 text-gray-600" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public'
      case 'private':
        return 'Private'
      case 'system':
        return 'System'
      default:
        return 'Private'
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Tag Management</h1>
          <p className="text-muted-foreground mt-1">
            Organize your content with custom tags
          </p>
        </div>
        
        <Button onClick={handleCreateTag} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Tag
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TAG_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {getCategoryDisplayName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(tags.map(tag => tag.category)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Tags</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter(tag => tag.visibility === 'public').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading tags...</div>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No tags found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first tag'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTags.map(tag => (
            <Card 
              key={tag.id} 
              className="hover:shadow-md transition-shadow border-l-4" 
              style={{ borderLeftColor: tag.color }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 
                          className="font-medium truncate"
                          style={{ color: tag.color }}
                        >
                          {tag.name}
                        </h3>
                        {tag.count > 0 && (
                          <Badge 
                            className="text-xs text-white border"
                            style={{ 
                              backgroundColor: tag.color,
                              borderColor: tag.color 
                            }}
                          >
                            {tag.count}
                          </Badge>
                        )}
                      </div>
                      {tag.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {tag.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTag(tag)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryDisplayName(tag.category)}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    {getVisibilityIcon(tag.visibility)}
                    <span className="text-xs text-muted-foreground">
                      {getVisibilityText(tag.visibility)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <TagFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <TagFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editingTag={editingTag}
        onSuccess={handleModalSuccess}
      />

      <TagDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        tagToDelete={tagToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}