"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface TagData {
  id: string
  name: string
  color: string
  category: string
}

interface ColoredTagPillsProps {
  selectedTags: string[]
  onRemoveTag: (tag: string) => void
  className?: string
}

export function ColoredTagPills({ selectedTags, onRemoveTag, className = "" }: ColoredTagPillsProps) {
  const [tagData, setTagData] = useState<Record<string, TagData>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedTags.length === 0) return

    const fetchTagData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/tags/stats')
        if (response.ok) {
          const data = await response.json()
          const tagMap: Record<string, TagData> = {}
          data.stats?.forEach((tag: TagData) => {
            tagMap[tag.name] = tag
          })
          setTagData(tagMap)
        }
      } catch (error) {
        console.error('Error fetching tag data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTagData()
  }, [selectedTags])

  if (selectedTags.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {selectedTags.map(tagName => {
        const tag = tagData[tagName]
        return (
          <Badge
            key={tagName}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-1 text-white border"
            style={{
              backgroundColor: tag?.color || '#6b7280',
              borderColor: tag?.color || '#6b7280',
              color: '#ffffff'
            }}
          >
            <span>{tagName}</span>
            <button
              onClick={() => onRemoveTag(tagName)}
              className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
              title={`Remove ${tagName} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )
      })}
    </div>
  )
}