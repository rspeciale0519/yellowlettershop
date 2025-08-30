"use client";

import React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Home,
  Info,
  Save,
  RotateCcw,
} from "lucide-react"
import type { PropertyCriteria } from "@/types/list-builder"
import { usePropertyFilters } from "@/hooks/filters/usePropertyFilters"
import { PropertyTypeSection } from "./PropertyTypeSection"
import { PropertyRangeSection } from "./PropertyRangeSection"
import { PropertyTemplates } from "./PropertyTemplates"
import { PropertySummary } from "./PropertySummary"

interface PropertyFiltersProps {
  criteria: PropertyCriteria
  onUpdate: (values: Partial<PropertyCriteria>) => void
}

export function PropertyFilters({ criteria, onUpdate }: PropertyFiltersProps) {
  const {
    expandedSections,
    showTemplates,
    customRanges,
    toggleSection,
    handlePropertyTypeChange,
    handleRangeChange,
    handleCustomRangeInput,
    applyCustomRange,
    applyTemplate,
    resetCriteria,
    hasActiveFilters,
    getSelectedTypesCount,
    formatValue,
  } = usePropertyFilters(criteria, onUpdate)

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Filter properties by physical characteristics, value, and features</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showTemplates.toggle()}
                    className="bg-transparent"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Templates
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use predefined property criteria templates</p>
                </TooltipContent>
              </Tooltip>
              {hasActiveFilters() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCriteria}
                      className="bg-transparent text-red-600 hover:text-red-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all property criteria to defaults</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Templates Section */}
          {showTemplates.value && (
            <PropertyTemplates onApplyTemplate={applyTemplate} />
          )}

          {/* Property Type Section */}
          <PropertyTypeSection
            criteria={criteria}
            onPropertyTypeChange={handlePropertyTypeChange}
            expanded={expandedSections.includes("property-type")}
            onToggle={() => toggleSection("property-type")}
            getSelectedTypesCount={getSelectedTypesCount}
          />

          {/* Property Value Section */}
          <PropertyRangeSection
            title="Property Value"
            description="Filter by estimated property value"
            field="propertyValue"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("propertyValue", value)}
            min={50000}
            max={5000000}
            step={25000}
            customRange={customRanges.propertyValue}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("property-value")}
            onToggle={() => toggleSection("property-value")}
            icon={<Home className="h-4 w-4 text-green-500" />}
            helpText="Property values are estimated based on recent sales and assessments"
          />

          {/* Square Footage Section */}
          <PropertyRangeSection
            title="Square Footage"
            description="Filter by building square footage"
            field="squareFootage"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("squareFootage", value)}
            min={500}
            max={15000}
            step={100}
            customRange={customRanges.squareFootage}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("square-footage")}
            onToggle={() => toggleSection("square-footage")}
            icon={<Home className="h-4 w-4 text-blue-500" />}
            helpText="Total finished square footage of the building"
          />

          {/* Year Built Section */}
          <PropertyRangeSection
            title="Year Built"
            description="Filter by construction year"
            field="yearBuilt"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("yearBuilt", value)}
            min={1900}
            max={new Date().getFullYear()}
            step={1}
            customRange={customRanges.yearBuilt}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("year-built")}
            onToggle={() => toggleSection("year-built")}
            icon={<Home className="h-4 w-4 text-orange-500" />}
            helpText="Year the property was originally constructed"
          />

          {/* Bedrooms Section */}
          <PropertyRangeSection
            title="Bedrooms"
            description="Number of bedrooms"
            field="bedrooms"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("bedrooms", value)}
            min={1}
            max={10}
            step={1}
            customRange={customRanges.bedrooms}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("bedrooms")}
            onToggle={() => toggleSection("bedrooms")}
            icon={<Home className="h-4 w-4 text-purple-500" />}
            helpText="Number of bedrooms in residential properties"
            residentialOnly
          />

          {/* Bathrooms Section */}
          <PropertyRangeSection
            title="Bathrooms"
            description="Number of bathrooms"
            field="bathrooms"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("bathrooms", value)}
            min={1}
            max={10}
            step={1}
            customRange={customRanges.bathrooms}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("bathrooms")}
            onToggle={() => toggleSection("bathrooms")}
            icon={<Home className="h-4 w-4 text-cyan-500" />}
            helpText="Number of bathrooms in residential properties"
            residentialOnly
          />

          {/* Lot Size Section */}
          <PropertyRangeSection
            title="Lot Size"
            description="Property lot size in acres"
            field="lotSize"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("lotSize", value)}
            min={0.1}
            max={50}
            step={0.1}
            customRange={customRanges.lotSize}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("lot-size")}
            onToggle={() => toggleSection("lot-size")}
            icon={<Home className="h-4 w-4 text-green-600" />}
            helpText="Total lot size including all land area"
          />

          {/* Summary Section */}
          {hasActiveFilters() && (
            <PropertySummary criteria={criteria} formatValue={formatValue} />
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}