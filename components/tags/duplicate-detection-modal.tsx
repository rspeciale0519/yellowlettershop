"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Copy,
  Merge,
  AlertTriangle,
  Tag,
  ArrowRight,
  Check,
  X
} from "lucide-react"
import { TagData } from "./tag-form-modal"

interface DuplicateGroup {
  id: string
  similarTags: TagData[]
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface DuplicateDetectionModalProps {
  isOpen: boolean
  onClose: () => void
  tags: TagData[]
  onMergeComplete: () => void
}

export function DuplicateDetectionModal({
  isOpen,
  onClose,
  tags,
  onMergeComplete
}: DuplicateDetectionModalProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  // Simulate duplicate detection algorithm
  useEffect(() => {
    if (!isOpen || !tags.length) return

    setIsAnalyzing(true)

    // Simulate analysis delay
    setTimeout(() => {
      const groups = detectDuplicates(tags)
      setDuplicateGroups(groups)
      setIsAnalyzing(false)
    }, 1500)
  }, [isOpen, tags])

  const detectDuplicates = (tagList: TagData[]): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = []
    const processed = new Set<string>()

    tagList.forEach((tag, index) => {
      if (processed.has(tag.id)) return

      const similar = tagList.filter((otherTag, otherIndex) => {
        if (index === otherIndex || processed.has(otherTag.id)) return false

        const similarity = calculateSimilarity(tag.name, otherTag.name)
        return similarity > 0.7 // 70% similarity threshold
      })

      if (similar.length > 0) {
        const allTags = [tag, ...similar]
        allTags.forEach(t => processed.add(t.id))

        const confidence = getConfidenceLevel(tag.name, similar[0].name)
        const reason = getReasonForSimilarity(tag.name, similar[0].name)

        groups.push({
          id: `group-${groups.length}`,
          similarTags: allTags,
          confidence,
          reason
        })
      }
    })

    return groups
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    // Exact match
    if (s1 === s2) return 1.0

    // Case insensitive match
    if (s1 === s2) return 0.95

    // Levenshtein distance
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))

    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    const maxLength = Math.max(s1.length, s2.length)
    return 1 - matrix[s2.length][s1.length] / maxLength
  }

  const getConfidenceLevel = (str1: string, str2: string): 'high' | 'medium' | 'low' => {
    const similarity = calculateSimilarity(str1, str2)
    if (similarity >= 0.9) return 'high'
    if (similarity >= 0.8) return 'medium'
    return 'low'
  }

  const getReasonForSimilarity = (str1: string, str2: string): string => {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    if (s1 === s2) return 'Identical names'
    if (s1.replace(/[^a-z0-9]/g, '') === s2.replace(/[^a-z0-9]/g, '')) return 'Same after removing special characters'
    if (Math.abs(s1.length - s2.length) <= 2) return 'Very similar spelling'
    return 'Similar names detected'
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-orange-600 bg-orange-50'
      case 'low': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(groupId)
      } else {
        newSet.delete(groupId)
      }
      return newSet
    })
  }

  const handleMergeSelected = async () => {
    if (selectedGroups.size === 0) {
      toast.error('Please select groups to merge')
      return
    }

    setIsProcessing(true)
    try {
      // Simulate merge API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success(`Merged ${selectedGroups.size} duplicate groups`)
      setSelectedGroups(new Set())
      onMergeComplete()
      onClose()
    } catch (error) {
      toast.error('Failed to merge duplicates')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-orange-500" />
            Duplicate Tag Detection
          </DialogTitle>
          <DialogDescription>
            Found potential duplicate tags that can be merged to clean up your tag system.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isAnalyzing ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Analyzing tags for duplicates...</p>
            </div>
          ) : duplicateGroups.length === 0 ? (
            <div className="text-center py-12">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-600">No Duplicates Found</h3>
              <p className="text-muted-foreground">Your tag system looks clean! No duplicate tags were detected.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Found {duplicateGroups.length} potential duplicate groups</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedGroups.size} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGroups(new Set(duplicateGroups.map(g => g.id)))}
                  >
                    Select All
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {duplicateGroups.map((group) => (
                  <Card key={group.id} className="border-l-4 border-l-orange-400">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedGroups.has(group.id)}
                          onCheckedChange={(checked) => handleGroupSelection(group.id, !!checked)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getConfidenceColor(group.confidence)}`} variant="outline">
                                {group.confidence} confidence
                              </Badge>
                              <span className="text-sm text-muted-foreground">{group.reason}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            {group.similarTags.map((tag, index) => (
                              <React.Fragment key={tag.id}>
                                {index > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border-2"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span className="font-medium" style={{ color: tag.color }}>
                                    {tag.name}
                                  </span>
                                  {(tag.count || 0) > 0 && (
                                    <Badge
                                      className="text-xs text-white"
                                      style={{ backgroundColor: tag.color }}
                                    >
                                      {tag.count}
                                    </Badge>
                                  )}
                                </div>
                              </React.Fragment>
                            ))}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Merging will combine usage from all tags and keep the most used tag name.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleMergeSelected}
            disabled={selectedGroups.size === 0 || isProcessing || isAnalyzing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Merging...
              </>
            ) : (
              <>
                <Merge className="h-4 w-4 mr-2" />
                Merge Selected ({selectedGroups.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}