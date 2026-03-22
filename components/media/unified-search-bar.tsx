"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'

interface Tag {
  id: string
  name: string
  color?: string
}

interface SearchSuggestion {
  type: 'tag' | 'file'
  value: string
  label: string
  color?: string
}

interface UnifiedSearchBarProps {
  searchQuery: string
  selectedTags: string[]
  onSearchChange: (query: string) => void
  onTagToggle: (tag: string) => void
  onClearAll: () => void
  mediaFiles: any[]
}

export function UnifiedSearchBar({
  searchQuery,
  selectedTags,
  onSearchChange,
  onTagToggle,
  onClearAll,
  mediaFiles
}: UnifiedSearchBarProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch available tags from Tag Manager system
  useEffect(() => {
    const fetchAvailableTags = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const response = await fetch(`/api/tags?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableTags()
  }, [])

  // Parse search query to extract tags and file search terms
  const parseSearchQuery = (query: string) => {
    const tagPattern = /#([^\s]+)/g
    const tags: string[] = []
    let match

    while ((match = tagPattern.exec(query)) !== null) {
      tags.push(match[1].toLowerCase())
    }

    const fileSearchTerm = query.replace(/#[^\s]+/g, '').trim()
    return { tags, fileSearchTerm }
  }

  // Generate suggestions based on current input
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.endsWith('#')) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const { tags: queryTags, fileSearchTerm } = parseSearchQuery(searchQuery)
    const newSuggestions: SearchSuggestion[] = []

    // If typing a tag (ends with # or current word starts with #)
    const words = searchQuery.split(' ')
    const lastWord = words[words.length - 1]
    const isTypingTag = lastWord.startsWith('#') || searchQuery.endsWith('#')

    if (isTypingTag) {
      const tagQuery = lastWord.startsWith('#') ? lastWord.slice(1).toLowerCase() : ''

      // Add matching tags that aren't already selected
      availableTags
        .filter(tag =>
          tag.name.toLowerCase().includes(tagQuery) &&
          !selectedTags.includes(tag.name.toLowerCase()) &&
          !queryTags.includes(tag.name.toLowerCase())
        )
        .slice(0, 10) // Show more tag suggestions
        .forEach(tag => {
          newSuggestions.push({
            type: 'tag',
            value: `#${tag.name}`,
            label: tag.name,
            color: tag.color
          })
        })
    }

    // Add file name suggestions if there's a file search term
    if (fileSearchTerm) {
      const matchingFiles = mediaFiles
        .filter(file =>
          file.filename.toLowerCase().includes(fileSearchTerm.toLowerCase())
        )
        .slice(0, 3)
        .map(file => file.filename)

      // Get unique file name suggestions
      const uniqueFileNames = [...new Set(matchingFiles)]
      uniqueFileNames.forEach(filename => {
        newSuggestions.push({
          type: 'file',
          value: filename,
          label: filename
        })
      })
    }

    setSuggestions(newSuggestions)
    setShowSuggestions(newSuggestions.length > 0)
    setActiveSuggestionIndex(-1)
  }, [searchQuery, availableTags, selectedTags, mediaFiles])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onSearchChange(value)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'tag') {
      // Add tag to search query
      const words = searchQuery.split(' ')
      const lastWord = words[words.length - 1]

      if (lastWord.startsWith('#')) {
        // Replace the current tag being typed
        words[words.length - 1] = suggestion.value
      } else {
        // Add new tag
        words.push(suggestion.value)
      }

      onSearchChange(words.join(' ') + ' ')
    } else {
      // Replace with file name
      const { tags } = parseSearchQuery(searchQuery)
      const tagPart = tags.map(tag => `#${tag}`).join(' ')
      const newQuery = tagPart ? `${suggestion.value} ${tagPart}` : suggestion.value
      onSearchChange(newQuery)
    }

    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[activeSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  const handleClearSearch = () => {
    onSearchChange('')
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  // Extract current search state
  const { tags: currentTags, fileSearchTerm } = parseSearchQuery(searchQuery)
  const allActiveTags = [...new Set([...selectedTags, ...currentTags])]

  return (
    <div className="space-y-3">
      {/* Unified Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search files by name or tags..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="pl-10 pr-10"
        />
        {(searchQuery || selectedTags.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={onClearAll}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.value}`}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                  index === activeSuggestionIndex
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.type === 'tag' ? (
                  <>
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: suggestion.color ? `${suggestion.color}15` : undefined,
                        borderColor: suggestion.color || undefined
                      }}
                    >
                      {suggestion.label}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm truncate">{suggestion.label}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(allActiveTags.length > 0 || fileSearchTerm) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {/* File Search Term */}
          {fileSearchTerm && (
            <Badge variant="secondary" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              {fileSearchTerm}
            </Badge>
          )}

          {/* Tag Filters */}
          {allActiveTags.map((tagName) => {
            const tag = availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
            const isFromQuery = currentTags.includes(tagName)
            const isFromSelected = selectedTags.includes(tagName)

            return (
              <Badge
                key={tagName}
                variant="default"
                className="cursor-pointer hover:bg-primary/80 transition-colors text-xs"
                onClick={() => onTagToggle(tagName)}
                style={{
                  backgroundColor: tag?.color || undefined
                }}
              >
                <Hash className="h-3 w-3 mr-1" />
                {tagName}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">
          Loading tags...
        </div>
      )}

      {/* Help Text */}
      {!searchQuery && availableTags.length > 0 && (
        <div className="text-xs text-muted-foreground">
          💡 Tip: Type normally to search files, or use #tagname to filter by tags
        </div>
      )}
    </div>
  )
}