"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Building, Star, TrendingUp, Shield, Zap } from "lucide-react"
import type { PropertyCriteria } from "@/types/list-builder"

interface PropertyTemplatesProps {
  onApplyTemplate: (template: Partial<PropertyCriteria>) => void
}

const PROPERTY_TEMPLATES = [
  {
    id: "luxury-homes",
    name: "Luxury Homes",
    description: "High-end residential properties",
    icon: Star,
    color: "text-yellow-500",
    criteria: {
      propertyTypes: ["single-family", "townhouse", "condo"],
      propertyValue: [500000, 2000000],
      squareFootage: [2500, 10000],
      bedrooms: [3, 8],
      bathrooms: [2, 8],
      yearBuilt: [2000, new Date().getFullYear()],
    },
  },
  {
    id: "investment-properties",
    name: "Investment Properties",
    description: "Multi-family and commercial properties",
    icon: TrendingUp,
    color: "text-green-500",
    criteria: {
      propertyTypes: ["multi-family", "commercial", "apartment"],
      propertyValue: [100000, 1000000],
      squareFootage: [1000, 5000],
      yearBuilt: [1980, new Date().getFullYear()],
    },
  },
  {
    id: "starter-homes",
    name: "Starter Homes",
    description: "Affordable first-time buyer properties",
    icon: Home,
    color: "text-blue-500",
    criteria: {
      propertyTypes: ["single-family", "townhouse", "condo"],
      propertyValue: [150000, 400000],
      squareFootage: [800, 2000],
      bedrooms: [2, 4],
      bathrooms: [1, 3],
      yearBuilt: [1970, new Date().getFullYear()],
    },
  },
  {
    id: "new-construction",
    name: "New Construction",
    description: "Recently built properties",
    icon: Zap,
    color: "text-purple-500",
    criteria: {
      propertyTypes: ["single-family", "townhouse", "condo", "apartment"],
      yearBuilt: [2015, new Date().getFullYear()],
      squareFootage: [1200, 8000],
      bedrooms: [2, 6],
      bathrooms: [2, 5],
    },
  },
  {
    id: "commercial-retail",
    name: "Commercial Retail",
    description: "Retail and commercial spaces",
    icon: Building,
    color: "text-orange-500",
    criteria: {
      propertyTypes: ["commercial", "retail", "office"],
      propertyValue: [200000, 2000000],
      squareFootage: [1000, 10000],
      yearBuilt: [1980, new Date().getFullYear()],
    },
  },
  {
    id: "historic-properties",
    name: "Historic Properties",
    description: "Older properties with character",
    icon: Shield,
    color: "text-red-500",
    criteria: {
      propertyTypes: ["single-family", "townhouse"],
      yearBuilt: [1900, 1970],
      squareFootage: [1000, 4000],
      propertyValue: [200000, 800000],
    },
  },
]

export function PropertyTemplates({ onApplyTemplate }: PropertyTemplatesProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Property Templates
        </CardTitle>
        <CardDescription>
          Apply predefined criteria templates to quickly filter for specific property types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROPERTY_TEMPLATES.map((template) => {
            const Icon = template.icon
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${template.color}`} />
                      <h4 className="font-medium text-sm">{template.name}</h4>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.criteria.propertyTypes?.length || 0} types
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{template.description}</p>

                  <div className="space-y-1 mb-4">
                    {template.criteria.propertyTypes && (
                      <div className="text-xs text-gray-500">
                        Types: {template.criteria.propertyTypes.slice(0, 2).join(", ")}
                        {template.criteria.propertyTypes.length > 2 && "..."}
                      </div>
                    )}
                    {template.criteria.propertyValue && (
                      <div className="text-xs text-gray-500">
                        Value: ${(template.criteria.propertyValue[0] / 1000).toFixed(0)}k - ${(template.criteria.propertyValue[1] / 1000).toFixed(0)}k
                      </div>
                    )}
                    {template.criteria.squareFootage && (
                      <div className="text-xs text-gray-500">
                        Size: {template.criteria.squareFootage[0]} - {template.criteria.squareFootage[1]} sq ft
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => onApplyTemplate(template.criteria)}
                  >
                    Apply Template
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
