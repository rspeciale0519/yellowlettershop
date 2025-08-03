"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Star, Download, Heart } from "lucide-react"
import Image from "next/image"
import type { Template } from "@/data/templates-data"

interface TemplateGridProps {
  templates: Template[]
  selectedCategory: string
  searchQuery: string
  isLoading: boolean
}

export function TemplateGrid({ templates, selectedCategory, searchQuery, isLoading }: TemplateGridProps) {
  const [favorites, setFavorites] = useState<string[]>([])

  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) => (prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId]))
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Eye className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">No templates found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {searchQuery
            ? `No templates match "${searchQuery}". Try adjusting your search or filters.`
            : "No templates available in this category."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {templates.length} template{templates.length !== 1 ? "s" : ""}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isFavorite={favorites.includes(template.id)}
            onToggleFavorite={() => toggleFavorite(template.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: Template
  isFavorite: boolean
  onToggleFavorite: () => void
}

function TemplateCard({ template, isFavorite, onToggleFavorite }: TemplateCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
        <Image
          src={template.previewImage || "/placeholder.svg"}
          alt={`${template.name} template preview`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white/90 text-gray-900 hover:bg-white">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{template.name}</DialogTitle>
                </DialogHeader>
                <div className="aspect-[4/3] relative rounded-lg overflow-hidden">
                  <Image
                    src={template.previewImage || "/placeholder.svg"}
                    alt={`${template.name} template preview`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1200px) 100vw, 80vw"
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              variant="secondary"
              onClick={onToggleFavorite}
              className="bg-white/90 hover:bg-white"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Template Type Badge */}
        <Badge variant="secondary" className="absolute top-2 left-2 bg-white/90 text-gray-900 capitalize">
          {template.type}
        </Badge>

        {/* Popularity Badge */}
        {template.popularity > 80 && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-gray-900">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Popular
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">{template.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 2}
              </Badge>
            )}
          </div>

          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <Download className="h-4 w-4 mr-1" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
