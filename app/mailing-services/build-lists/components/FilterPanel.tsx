"use client"

import React from "react"
import { GeographyFilters } from "@/components/list-builder/geography-filters"
import { PropertyFilters } from "@/components/list-builder/property-filters"
import { DemographicsFilters } from "@/components/list-builder/demographics-filters"
import { MortgageFilters } from "@/components/list-builder/mortgage-filters"
import { ForeclosureFilters } from "@/components/list-builder/foreclosure-filters"
import { PredictiveFilters } from "@/components/list-builder/predictive-filters"
import { OptionsFilters } from "@/components/list-builder/options-filters"
import type { Criteria, ListCriteria } from "@/types/list-builder"

interface FilterPanelProps {
  activeCategory: string
  criteria: ListCriteria
  updateCriteria: (category: keyof ListCriteria, values: Partial<Criteria>) => void
}

export function FilterPanel({ activeCategory, criteria, updateCriteria }: FilterPanelProps) {
  switch (activeCategory) {
    case "geography":
      return (
        <GeographyFilters criteria={criteria.geography} onUpdate={(values) => updateCriteria("geography", values)} />
      )
    case "property":
      return (
        <PropertyFilters criteria={criteria.property} onUpdate={(values) => updateCriteria("property", values)} />
      )
    case "demographics":
      return (
        <DemographicsFilters
          criteria={criteria.demographics}
          onUpdate={(values) => updateCriteria("demographics", values)}
        />
      )
    case "mortgage":
      return (
        <MortgageFilters criteria={criteria.mortgage} onUpdate={(values) => updateCriteria("mortgage", values)} />
      )
    case "foreclosure":
      return (
        <ForeclosureFilters
          criteria={criteria.foreclosure}
          onUpdate={(values) => updateCriteria("foreclosure", values)}
        />
      )
    case "predictive":
      return (
        <PredictiveFilters
          criteria={criteria.predictive}
          onUpdate={(values) => updateCriteria("predictive", values)}
        />
      )
    case "options":
      return <OptionsFilters />
    default:
      return null
  }
}
