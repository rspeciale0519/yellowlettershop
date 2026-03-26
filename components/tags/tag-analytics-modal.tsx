"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Activity,
  Tag,
  Users,
  Calendar,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Flame
} from "lucide-react"
import { TagData } from "./tag-form-modal"

interface TagAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  tags: TagData[]
}

interface TagUsageData {
  tag: TagData
  usageCount: number
  trend: 'up' | 'down' | 'stable'
  lastUsed: string
  filesTagged: number
}

interface CategoryStats {
  category: string
  count: number
  usage: number
  percentage: number
}

export function TagAnalyticsModal({
  isOpen,
  onClose,
  tags
}: TagAnalyticsModalProps) {
  const [usageData, setUsageData] = useState<TagUsageData[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !tags.length) return

    setIsLoading(true)

    // Simulate API call to get usage analytics
    setTimeout(() => {
      const mockUsageData: TagUsageData[] = tags.map(tag => ({
        tag,
        usageCount: tag.count || 0,
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        filesTagged: Math.floor(Math.random() * 50)
      })).sort((a, b) => b.usageCount - a.usageCount)

      const categoryMap = new Map<string, { count: number, usage: number }>()

      tags.forEach(tag => {
        const current = categoryMap.get(tag.category) || { count: 0, usage: 0 }
        categoryMap.set(tag.category, {
          count: current.count + 1,
          usage: current.usage + (tag.count || 0)
        })
      })

      const totalTags = tags.length
      const mockCategoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        usage: data.usage,
        percentage: Math.round((data.count / totalTags) * 100)
      })).sort((a, b) => b.usage - a.usage)

      setUsageData(mockUsageData)
      setCategoryStats(mockCategoryStats)
      setIsLoading(false)
    }, 1000)
  }, [isOpen, tags])

  const getTopTags = () => usageData.slice(0, 10)
  const getUnusedTags = () => usageData.filter(data => data.usageCount === 0)
  const getRecentlyUsedTags = () => usageData
    .filter(data => new Date(data.lastUsed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .slice(0, 5)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Tag Analytics Dashboard
          </DialogTitle>
          <DialogDescription>
            Comprehensive insights into your tag usage patterns and performance metrics.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Analyzing tag usage patterns...</p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="usage">Usage Stats</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Total Tags</p>
                          <p className="text-2xl font-bold">{tags.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Active Tags</p>
                          <p className="text-2xl font-bold">{usageData.filter(d => d.usageCount > 0).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Unused</p>
                          <p className="text-2xl font-bold">{getUnusedTags().length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Total Usage</p>
                          <p className="text-2xl font-bold">{usageData.reduce((sum, d) => sum + d.usageCount, 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performance */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Top Performing Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {getTopTags().slice(0, 5).map((data, index) => (
                        <div key={data.tag.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium w-4">#{index + 1}</span>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.tag.color }}
                            />
                            <span className="font-medium" style={{ color: data.tag.color }}>
                              {data.tag.name}
                            </span>
                            {getTrendIcon(data.trend)}
                          </div>
                          <Badge variant="outline">{data.usageCount}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Recently Active
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {getRecentlyUsedTags().map((data) => (
                        <div key={data.tag.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.tag.color }}
                            />
                            <span className="font-medium" style={{ color: data.tag.color }}>
                              {data.tag.name}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(data.lastUsed)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {usageData.slice(0, 15).map((data) => (
                        <div key={data.tag.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: data.tag.color }}
                              />
                              <span className="font-medium" style={{ color: data.tag.color }}>
                                {data.tag.name}
                              </span>
                              {getTrendIcon(data.trend)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {data.usageCount} uses
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {data.filesTagged} files
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: data.tag.color,
                                width: `${Math.min((data.usageCount / Math.max(...usageData.map(d => d.usageCount))) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {categoryStats.map((stat) => (
                        <div key={stat.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{stat.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {stat.count} tags
                              </span>
                              <Badge variant="outline">{stat.percentage}%</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${stat.percentage}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categoryStats.map((stat) => (
                        <div key={stat.category} className="flex items-center justify-between">
                          <span className="font-medium capitalize">{stat.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {stat.usage} total uses
                            </span>
                            <Badge>{Math.round(stat.usage / stat.count)} avg</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Optimization Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-orange-800">Unused Tags</h4>
                        <p className="text-sm text-orange-700">
                          {getUnusedTags().length} tags have never been used. Consider removing them.
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800">Low Usage Tags</h4>
                        <p className="text-sm text-blue-700">
                          {usageData.filter(d => d.usageCount > 0 && d.usageCount < 3).length} tags are rarely used.
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800">Active Tags</h4>
                        <p className="text-sm text-green-700">
                          {usageData.filter(d => d.usageCount >= 10).length} tags are performing well.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="font-medium">Most Effective Categories:</h4>
                        {categoryStats.slice(0, 3).map((stat) => (
                          <div key={stat.category} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{stat.category}</span>
                            <Badge variant="outline">{Math.round(stat.usage / stat.count)} avg uses</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Trending Tags:</h4>
                        {usageData.filter(d => d.trend === 'up').slice(0, 3).map((data) => (
                          <div key={data.tag.id} className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-sm" style={{ color: data.tag.color }}>
                              {data.tag.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}