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
  Grid,
  List,
  CheckSquare,
  Square,
  Download,
  Upload,
  MoreHorizontal,
  Copy,
  Merge,
  TrendingUp,
  AlertTriangle,
  Filter,
  X,
  Hash,
  BarChart3,
  FileSpreadsheet,
  Zap,
  Target,
  Activity
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
import { BulkTagDeleteModal } from "@/components/tags/bulk-tag-delete-modal"
import { DuplicateDetectionModal } from "@/components/tags/duplicate-detection-modal"
import { TagAnalyticsModal } from "@/components/tags/tag-analytics-modal"
import { TAG_CATEGORIES, getCategoryDisplayName } from "@/lib/constants/tag-categories"

// Enhanced tag interface with additional stats
interface TagWithStats extends TagData {
  count: number
  usageFrequency: 'high' | 'medium' | 'low' | 'unused'
  lastUsed?: string
  filesCount: number
  recentActivity: number
}

// Stats interface
interface TagStats {
  totalTags: number
  categoriesCount: number
  publicTags: number
  unusedTags: number
  averageUsage: number
  mostUsedTag: string
  duplicatesDetected: number
}

export default function EnhancedTagManagerContent() {
  const [tags, setTags] = useState<TagWithStats[]>([])
  const [filteredTags, setFilteredTags] = useState<TagWithStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedUsageFilter, setSelectedUsageFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showSystemTags, setShowSystemTags] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<TagStats | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Bulk operations state
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagData | null>(null)
  const [tagToDelete, setTagToDelete] = useState<TagData | null>(null)

  // Fetch tags with enhanced stats
  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tags/enhanced-stats')

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please log in to access tags')
          return
        }
        throw new Error('Failed to fetch tags')
      }

      const data = await response.json()
      setTags(data.tags || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to load tags')
      setTags([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Enhanced filtering
  useEffect(() => {
    let filtered = tags

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tag =>
        tag.name.toLowerCase().includes(query) ||
        tag.description?.toLowerCase().includes(query) ||
        tag.category.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tag => tag.category === selectedCategory)
    }

    // Usage frequency filter
    if (selectedUsageFilter !== 'all') {
      filtered = filtered.filter(tag => tag.usageFrequency === selectedUsageFilter)
    }

    setFilteredTags(filtered)
    setCurrentPage(1) // Reset pagination when filters change
  }, [tags, searchQuery, selectedCategory, selectedUsageFilter])

  // Separate user and system tags for visual hierarchy
  const userTags = filteredTags.filter(tag => !tag.is_system)
  const systemTags = showSystemTags ? filteredTags.filter(tag => tag.is_system) : []

  // Pagination logic (use all filtered tags for now, we'll separate visually)
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTags = filteredTags.slice(startIndex, endIndex)

  // Separate paginated tags into user and system for visual hierarchy
  const paginatedUserTags = paginatedTags.filter(tag => !tag.is_system)
  const paginatedSystemTags = showSystemTags ? paginatedTags.filter(tag => tag.is_system) : []

  // Bulk operations
  const handleTagSelect = (tagId: string, selected: boolean) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(tagId)
      } else {
        newSet.delete(tagId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const allTagIds = paginatedTags.map(tag => tag.id)
    setSelectedTags(new Set(allTagIds))
  }

  const handleClearSelection = () => {
    setSelectedTags(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedTags.size === 0) return
    setBulkDeleteModalOpen(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedTags.size === 0) return

    try {
      // Execute delete requests and check responses
      const deletePromises = Array.from(selectedTags).map(async (tagId) => {
        const response = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
        const result = await response.json()
        return { tagId, success: response.ok, error: result.error }
      })

      const results = await Promise.all(deletePromises)

      // Count successful and failed deletions
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      // Show appropriate messages
      if (successful.length > 0) {
        toast.success(`Deleted ${successful.length} tag${successful.length !== 1 ? 's' : ''}`)
      }

      if (failed.length > 0) {
        // Check if failures were due to system tags
        const systemTagErrors = failed.filter(r => r.error === 'Cannot delete system tags')
        const otherErrors = failed.filter(r => r.error !== 'Cannot delete system tags')

        if (systemTagErrors.length > 0) {
          toast.error(`Cannot delete ${systemTagErrors.length} system tag${systemTagErrors.length !== 1 ? 's' : ''}`)
        }

        if (otherErrors.length > 0) {
          toast.error(`Failed to delete ${otherErrors.length} tag${otherErrors.length !== 1 ? 's' : ''}`)
        }
      }

      setSelectedTags(new Set())
      setBulkDeleteModalOpen(false)
      fetchTags()
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete tags')
    }
  }

  const handleRemoveFromBulkDelete = (tagId: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev)
      newSet.delete(tagId)
      return newSet
    })
  }

  // Tag operations
  const handleCreateTag = () => {
    setEditingTag(null)
    setFormModalOpen(true)
  }

  const handleEditTag = (tag: TagData) => {
    setEditingTag(tag)
    setFormModalOpen(true)
  }

  const handleDeleteTag = (tag: TagData) => {
    setTagToDelete(tag)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return

    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete tag')
      }

      toast.success('Tag deleted successfully')
      setDeleteModalOpen(false)
      setTagToDelete(null)
      fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error(`Failed to delete tag: ${error.message}`)
    }
  }

  const handleModalSuccess = () => {
    fetchTags()
  }

  // Utility functions
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

  const getUsageFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'high':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-blue-600 bg-blue-50'
      case 'low':
        return 'text-yellow-600 bg-yellow-50'
      case 'unused':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Helper function to render tag cards
  const renderTagCard = (tag: TagWithStats, isSystemTag = false) => (
    <Card
      key={tag.id}
      className={`hover:shadow-md transition-shadow border-l-4 ${
        isSystemTag ? 'opacity-70 bg-gray-50/50' : ''
      }`}
      style={{ borderLeftColor: tag.color }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {bulkSelectMode && (
            <div className="flex items-center mr-3">
              <input
                type="checkbox"
                checked={selectedTags.has(tag.id)}
                onChange={(e) => handleTagSelect(tag.id, e.target.checked)}
                className="rounded"
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-4 h-4 rounded-full border-2 flex-shrink-0"
              style={{ backgroundColor: tag.color, borderColor: tag.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate text-sm" style={{ color: tag.color }}>
                {tag.name}
              </h3>
              {tag.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {tag.description}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!tag.is_system && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteTag(tag)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getCategoryDisplayName(tag.category)}
            </Badge>
            {tag.is_system && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                System
              </Badge>
            )}
            <Badge
              className={`text-xs ${getUsageFrequencyColor(tag.usageFrequency)}`}
              variant="outline"
            >
              {tag.usageFrequency}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {getVisibilityIcon(tag.visibility)}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Tag Management</h1>
            <p className="text-muted-foreground mt-1">
              Organize and manage your content tags with advanced features
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showSystemTags ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSystemTags(!showSystemTags)}
              className="gap-2"
            >
              <Hash className="h-4 w-4" />
              {showSystemTags ? 'Hide' : 'Show'} System Tags
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleCreateTag} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Tag
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tags by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
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

            <Select value={selectedUsageFilter} onValueChange={setSelectedUsageFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Usage</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Operations Toolbar */}
        {bulkSelectMode && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedTags.size === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkSelectMode(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={bulkSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => setBulkSelectMode(!bulkSelectMode)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Bulk Select
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnalyticsModalOpen(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDuplicateModalOpen(true)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Find Duplicates
            </Button>
          </div>
        </div>
      </div>

      {/* Tags Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading tags...</div>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No tags found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' || selectedUsageFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first tag'}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-6">
            {/* User Tags Section */}
            {paginatedUserTags.length > 0 && (
              <div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedUserTags.map(tag => renderTagCard(tag, false))}
                </div>
              </div>
            )}

            {/* System Tags Section */}
            {paginatedSystemTags.length > 0 && (
              <div>
                {paginatedUserTags.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-700">System Tags</h3>
                      <Badge variant="outline" className="text-xs text-gray-500">
                        {paginatedSystemTags.length}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedSystemTags.map(tag => renderTagCard(tag, true))}
                </div>
              </div>
            )}

            {/* No tags message */}
            {paginatedUserTags.length === 0 && paginatedSystemTags.length === 0 && (
              <div className="text-center py-12">
                <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No tags found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery || selectedCategory !== 'all' || selectedUsageFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first tag'}
                </p>
              </div>
            )}
          </div>
        ) : (
          // List view would go here - simplified for now
          <div className="text-center py-12">
            <p className="text-muted-foreground">List view coming soon...</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTags.length)} of {filteredTags.length} tags
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TagFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        editingTag={editingTag}
        onSuccess={handleModalSuccess}
      />

      <TagDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        tag={tagToDelete}
        onConfirm={handleConfirmDelete}
      />

      <BulkTagDeleteModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        tags={Array.from(selectedTags).map(id => tags.find(tag => tag.id === id)).filter(Boolean) as TagData[]}
        onConfirm={handleConfirmBulkDelete}
        onRemoveTag={handleRemoveFromBulkDelete}
      />

      <DuplicateDetectionModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        tags={tags}
        onMergeComplete={handleModalSuccess}
      />

      <TagAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        tags={tags}
      />
    </div>
  )
}