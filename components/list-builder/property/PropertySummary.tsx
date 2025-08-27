"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Info } from "lucide-react"
import type { PropertyCriteria } from "@/types/list-builder"

interface PropertySummaryProps {
  criteria: PropertyCriteria
  formatValue: (field: keyof PropertyCriteria, value: number) => string
}

export function PropertySummary({ criteria, formatValue }: PropertySummaryProps) {
  const getActiveFilters = () => {
    const filters = []

    if (criteria.propertyTypes.length > 0) {
      filters.push({
        label: "Property Types",
        value: `${criteria.propertyTypes.length} selected`,
        details: criteria.propertyTypes.slice(0, 3).join(", ") + (criteria.propertyTypes.length > 3 ? "..." : ""),
      })
    }

    if (criteria.propertyValue[0] !== 50000 || criteria.propertyValue[1] !== 2000000) {
      filters.push({
        label: "Property Value",
        value: `${formatValue("propertyValue", criteria.propertyValue[0])} - ${formatValue("propertyValue", criteria.propertyValue[1])}`,
      })
    }

    if (criteria.squareFootage[0] !== 500 || criteria.squareFootage[1] !== 10000) {
      filters.push({
        label: "Square Footage",
        value: `${formatValue("squareFootage", criteria.squareFootage[0])} - ${formatValue("squareFootage", criteria.squareFootage[1])}`,
      })
    }

    if (criteria.yearBuilt[0] !== 1900 || criteria.yearBuilt[1] !== new Date().getFullYear()) {
      filters.push({
        label: "Year Built",
        value: `${criteria.yearBuilt[0]} - ${criteria.yearBuilt[1]}`,
      })
    }

    if (criteria.bedrooms[0] !== 1 || criteria.bedrooms[1] !== 8) {
      filters.push({
        label: "Bedrooms",
        value: `${criteria.bedrooms[0]} - ${criteria.bedrooms[1]}`,
      })
    }

    if (criteria.bathrooms[0] !== 1 || criteria.bathrooms[1] !== 8) {
      filters.push({
        label: "Bathrooms",
        value: `${criteria.bathrooms[0]} - ${criteria.bathrooms[1]}`,
      })
    }

    if (criteria.lotSize[0] !== 0.1 || criteria.lotSize[1] !== 10) {
      filters.push({
        label: "Lot Size",
        value: `${formatValue("lotSize", criteria.lotSize[0])} - ${formatValue("lotSize", criteria.lotSize[1])}`,
      })
    }

    return filters
  }

  const activeFilters = getActiveFilters()

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Info className="h-4 w-4" />
          Active Property Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeFilters.map((filter, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-yellow-200 last:border-b-0">
            <div className="flex-1">
              <div className="font-medium text-sm text-yellow-800">{filter.label}</div>
              {filter.details && (
                <div className="text-xs text-yellow-600 mt-1">{filter.details}</div>
              )}
            </div>
            <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-100">
              {filter.value}
            </Badge>
          </div>
        ))}

        <div className="text-xs text-yellow-600 mt-3 pt-3 border-t border-yellow-200">
          These filters will be applied when building your mailing list
        </div>
      </CardContent>
    </Card>
  )
}
