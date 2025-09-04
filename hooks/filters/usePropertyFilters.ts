import { useState, useCallback } from "react"
import type { PropertyCriteria } from "@/types/list-builder"

interface UsePropertyFiltersProps {
  criteria: PropertyCriteria
  onUpdate: (values: Partial<PropertyCriteria>) => void
}

interface CustomRangeState {
  propertyValue: [number, number] | null
  squareFootage: [number, number] | null
  yearBuilt: [number, number] | null
  bedrooms: [number, number] | null
  bathrooms: [number, number] | null
  lotSize: [number, number] | null
}

export function usePropertyFilters({ criteria, onUpdate }: UsePropertyFiltersProps) {
  
  const [showTemplates, setShowTemplates] = useState({ value: false, toggle: () => setShowTemplates(prev => ({ ...prev, value: !prev.value })) })
  const [expandedSections, setExpandedSections] = useState<string[]>(["property-type"])
  const [customRanges, setCustomRanges] = useState<CustomRangeState>({
    propertyValue: null,
    squareFootage: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    lotSize: null,
  })

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }, [])

  const handlePropertyTypeChange = useCallback((propertyTypes: string[]) => {
    onUpdate({ propertyTypes })
  }, [onUpdate])

  const handleRangeChange = useCallback((field: keyof PropertyCriteria, value: number[]) => {
    onUpdate({ [field]: value })
  }, [onUpdate])

  const handleCustomRangeInput = useCallback((field: keyof CustomRangeState, value: [number, number] | null) => {
    setCustomRanges(prev => ({ ...prev, [field]: value }))
  }, [])

  const applyCustomRange = useCallback((field: keyof CustomRangeState) => {
    const customRange = customRanges[field]
    if (customRange) {
      onUpdate({ [field]: customRange })
      setCustomRanges(prev => ({ ...prev, [field]: null }))
    }
  }, [customRanges, onUpdate])

  const applyTemplate = useCallback((templateCriteria: Partial<PropertyCriteria>) => {
    onUpdate(templateCriteria)
  }, [onUpdate])

  const resetCriteria = useCallback(() => {
    const defaultCriteria: PropertyCriteria = {
      propertyTypes: [],
      yearBuilt: [1900, new Date().getFullYear()],
      squareFootage: [500, 10000],
      bedrooms: [1, 8],
      bathrooms: [1, 8],
      lotSize: [0.1, 10],
      propertyValue: [50000, 2000000],
    }
    onUpdate(defaultCriteria)
  }, [onUpdate])

  const hasActiveFilters = useCallback(() => {
    return (
      criteria.propertyTypes.length > 0 ||
      criteria.yearBuilt[0] !== 1900 ||
      criteria.yearBuilt[1] !== new Date().getFullYear() ||
      criteria.squareFootage[0] !== 500 ||
      criteria.squareFootage[1] !== 10000 ||
      criteria.bedrooms[0] !== 1 ||
      criteria.bedrooms[1] !== 8 ||
      criteria.bathrooms[0] !== 1 ||
      criteria.bathrooms[1] !== 8 ||
      criteria.lotSize[0] !== 0.1 ||
      criteria.lotSize[1] !== 10 ||
      criteria.propertyValue[0] !== 50000 ||
      criteria.propertyValue[1] !== 2000000
    )
  }, [criteria])

  const getSelectedTypesCount = useCallback(() => {
    return criteria.propertyTypes.length
  }, [criteria.propertyTypes])

  const formatValue = useCallback((field: keyof PropertyCriteria, value: number) => {
    switch (field) {
      case 'propertyValue':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case 'squareFootage':
        return `${value.toLocaleString()} sq ft`
      case 'lotSize':
        return `${value} acres`
      case 'bedrooms':
      case 'bathrooms':
        return value.toString()
      case 'yearBuilt':
        return value.toString()
      default:
        return value.toString()
    }
  }, [])

  return {
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
  }
}
