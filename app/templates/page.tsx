"use client"

import { useState, useEffect, useMemo } from "react"
import { TemplatesLayout } from "@/components/templates/templates-layout"
import { TemplateGrid } from "@/components/templates/template-grid"
import { TemplateSearch } from "@/components/templates/template-search"
import { TemplateFilters } from "@/components/templates/template-filters"
import { CategoryAccordion } from "@/components/templates/category-accordion"
import { templatesData } from "@/data/templates-data"
import { Loader2 } from "lucide-react"

export type SortOption = "popular" | "newest" | "alphabetical"
export type FilterOption = "all" | "letter" | "postcard" | "envelope"

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("popular")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["real-estate"])

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter and sort templates based on current selections
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templatesData.templates

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    // Filter by type
    if (filterBy !== "all") {
      filtered = filtered.filter((template) => template.type === filterBy)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Sort templates
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.popularity - a.popularity
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "alphabetical":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return sorted
  }, [selectedCategory, searchQuery, sortBy, filterBy])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">Template Gallery</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from our professionally designed templates to kickstart your direct mail campaign
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="flex-1 max-w-md">
            <TemplateSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <TemplateFilters
              sortBy={sortBy}
              filterBy={filterBy}
              onSortChange={setSortBy}
              onFilterChange={setFilterBy}
            />
          </div>
        </div>

        {/* Main Layout */}
        <TemplatesLayout
          sidebar={
            <CategoryAccordion
              categories={templatesData.categories}
              selectedCategory={selectedCategory}
              expandedCategories={expandedCategories}
              onCategorySelect={handleCategorySelect}
              onCategoryToggle={handleCategoryToggle}
            />
          }
          main={
            <TemplateGrid
              templates={filteredAndSortedTemplates}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              isLoading={false}
            />
          }
        />
      </div>
    </div>
  )
}
