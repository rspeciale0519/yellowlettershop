"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Home, Building, Warehouse, Store, Factory, Hotel, Church, School, Hospital } from "lucide-react"
import type { PropertyCriteria } from "@/types/list-builder"

interface PropertyTypeSectionProps {
  criteria: PropertyCriteria
  onPropertyTypeChange: (propertyTypes: string[]) => void
  expanded: boolean
  onToggle: () => void
  getSelectedTypesCount: () => number
}

const PROPERTY_TYPES = [
  { value: "single-family", label: "Single Family", icon: Home },
  { value: "multi-family", label: "Multi Family", icon: Building },
  { value: "condo", label: "Condo", icon: Building },
  { value: "townhouse", label: "Townhouse", icon: Building },
  { value: "mobile-home", label: "Mobile Home", icon: Home },
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "commercial", label: "Commercial", icon: Store },
  { value: "industrial", label: "Industrial", icon: Factory },
  { value: "warehouse", label: "Warehouse", icon: Warehouse },
  { value: "retail", label: "Retail", icon: Store },
  { value: "office", label: "Office", icon: Building },
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "vacant-land", label: "Vacant Land", icon: Home },
  { value: "religious", label: "Religious", icon: Church },
  { value: "educational", label: "Educational", icon: School },
  { value: "medical", label: "Medical", icon: Hospital },
]

export function PropertyTypeSection({
  criteria,
  onPropertyTypeChange,
  expanded,
  onToggle,
  getSelectedTypesCount,
}: PropertyTypeSectionProps) {
  const handleTypeToggle = (typeValue: string, checked: boolean) => {
    const newTypes = checked
      ? [...criteria.propertyTypes, typeValue]
      : criteria.propertyTypes.filter(type => type !== typeValue)
    onPropertyTypeChange(newTypes)
  }

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-4 h-auto hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Property Types</div>
                <div className="text-sm text-gray-500">
                  {getSelectedTypesCount()} of {PROPERTY_TYPES.length} selected
                </div>
              </div>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {PROPERTY_TYPES.map((type) => {
            const Icon = type.icon
            const isChecked = criteria.propertyTypes.includes(type.value)
            return (
              <div key={type.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={type.value}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleTypeToggle(type.value, checked as boolean)}
                />
                <label
                  htmlFor={type.value}
                  className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1"
                >
                  <Icon className="h-4 w-4 text-gray-500" />
                  {type.label}
                </label>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
