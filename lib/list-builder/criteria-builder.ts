import { ListBuilderCriteria, DemographicFilters, GeographicFilters, PropertyFilters } from '@/types/supabase'

/**
 * Builds JSONB criteria object from form inputs
 */
export function buildCriteria(
  demographic: DemographicFilters,
  geographic: GeographicFilters,
  property: PropertyFilters
): ListBuilderCriteria {
  return {
    demographic: {
      age_range: demographic.age_range,
      income_range: demographic.income_range,
      home_value_range: demographic.home_value_range,
      credit_score_range: demographic.credit_score_range,
      marital_status: demographic.marital_status,
      presence_of_children: demographic.presence_of_children,
      education_level: demographic.education_level,
      occupation: demographic.occupation,
      lifestyle_interests: demographic.lifestyle_interests
    },
    geographic: {
      states: geographic.states,
      counties: geographic.counties,
      cities: geographic.cities,
      zip_codes: geographic.zip_codes,
      radius_miles: geographic.radius_miles,
      center_point: geographic.center_point,
      exclude_po_boxes: geographic.exclude_po_boxes,
      rural_urban_classification: geographic.rural_urban_classification
    },
    property: {
      property_type: property.property_type,
      ownership_status: property.ownership_status,
      years_owned_range: property.years_owned_range,
      mortgage_status: property.mortgage_status,
      equity_range: property.equity_range,
      square_footage_range: property.square_footage_range,
      lot_size_range: property.lot_size_range,
      year_built_range: property.year_built_range,
      bedrooms_range: property.bedrooms_range,
      bathrooms_range: property.bathrooms_range
    }
  }
}

/**
 * Validates criteria object for completeness
 */
export function validateCriteria(criteria: ListBuilderCriteria): {
  isValid: boolean
  errors: string[]
  estimatedCount?: number
} {
  const errors: string[] = []

  // Geographic validation - at least one location filter required
  const hasGeographic = 
    criteria.geographic.states?.length ||
    criteria.geographic.counties?.length ||
    criteria.geographic.cities?.length ||
    criteria.geographic.zip_codes?.length ||
    criteria.geographic.center_point

  if (!hasGeographic) {
    errors.push('At least one geographic filter is required')
  }

  // Demographic validation - at least one filter recommended
  const hasDemographic = Object.values(criteria.demographic).some(value => 
    value !== null && value !== undefined && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  if (!hasDemographic) {
    errors.push('At least one demographic filter is recommended for better targeting')
  }

  // Range validations
  if (criteria.demographic.age_range) {
    const [min, max] = criteria.demographic.age_range
    if (min >= max || min < 18 || max > 120) {
      errors.push('Invalid age range')
    }
  }

  if (criteria.demographic.income_range) {
    const [min, max] = criteria.demographic.income_range
    if (min >= max || min < 0) {
      errors.push('Invalid income range')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    estimatedCount: estimateListSize(criteria)
  }
}

/**
 * Estimates list size based on criteria (placeholder logic)
 */
function estimateListSize(criteria: ListBuilderCriteria): number {
  // This would integrate with MelissaData API for actual estimates
  // For now, return a rough estimate based on geographic scope
  let baseCount = 10000

  // Adjust based on geographic filters
  if (criteria.geographic.states?.length) {
    baseCount *= criteria.geographic.states.length * 0.8
  }
  if (criteria.geographic.counties?.length) {
    baseCount = Math.min(baseCount, criteria.geographic.counties.length * 5000)
  }
  if (criteria.geographic.cities?.length) {
    baseCount = Math.min(baseCount, criteria.geographic.cities.length * 2000)
  }
  if (criteria.geographic.zip_codes?.length) {
    baseCount = Math.min(baseCount, criteria.geographic.zip_codes.length * 500)
  }

  // Apply demographic filters (reduce count)
  const demographicFilters = Object.values(criteria.demographic).filter(v => 
    v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  const reductionFactor = Math.pow(0.7, demographicFilters)
  baseCount *= reductionFactor

  // Apply property filters (further reduce)
  const propertyFilters = Object.values(criteria.property).filter(v => 
    v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  const propertyReduction = Math.pow(0.8, propertyFilters)
  baseCount *= propertyReduction

  return Math.max(100, Math.round(baseCount))
}

/**
 * Converts criteria to MelissaData API format
 */
export function criteriaTomMelissaDataFormat(criteria: ListBuilderCriteria): Record<string, any> {
  const melissaParams: Record<string, any> = {}

  // Geographic filters
  if (criteria.geographic.states?.length) {
    melissaParams.states = criteria.geographic.states.join(',')
  }
  if (criteria.geographic.counties?.length) {
    melissaParams.counties = criteria.geographic.counties.join(',')
  }
  if (criteria.geographic.cities?.length) {
    melissaParams.cities = criteria.geographic.cities.join(',')
  }
  if (criteria.geographic.zip_codes?.length) {
    melissaParams.zip_codes = criteria.geographic.zip_codes.join(',')
  }
  if (criteria.geographic.radius_miles && criteria.geographic.center_point) {
    melissaParams.radius = criteria.geographic.radius_miles
    melissaParams.center_lat = criteria.geographic.center_point.lat
    melissaParams.center_lng = criteria.geographic.center_point.lng
  }

  // Demographic filters
  if (criteria.demographic.age_range) {
    melissaParams.age_min = criteria.demographic.age_range[0]
    melissaParams.age_max = criteria.demographic.age_range[1]
  }
  if (criteria.demographic.income_range) {
    melissaParams.income_min = criteria.demographic.income_range[0]
    melissaParams.income_max = criteria.demographic.income_range[1]
  }
  if (criteria.demographic.home_value_range) {
    melissaParams.home_value_min = criteria.demographic.home_value_range[0]
    melissaParams.home_value_max = criteria.demographic.home_value_range[1]
  }
  if (criteria.demographic.marital_status?.length) {
    melissaParams.marital_status = criteria.demographic.marital_status.join(',')
  }
  if (criteria.demographic.education_level?.length) {
    melissaParams.education = criteria.demographic.education_level.join(',')
  }

  // Property filters
  if (criteria.property.property_type?.length) {
    melissaParams.property_type = criteria.property.property_type.join(',')
  }
  if (criteria.property.ownership_status) {
    melissaParams.ownership = criteria.property.ownership_status
  }
  if (criteria.property.years_owned_range) {
    melissaParams.years_owned_min = criteria.property.years_owned_range[0]
    melissaParams.years_owned_max = criteria.property.years_owned_range[1]
  }

  return melissaParams
}
