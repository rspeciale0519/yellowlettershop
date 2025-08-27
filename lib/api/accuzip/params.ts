// AccuZIP parameter conversion utilities
import type { ListCriteria } from '@/lib/supabase/mailing-lists'

interface AccuZIPSearchParams {
  states?: string[]
  cities?: string[]
  zipCodes?: string[]
  counties?: string[]
  propertyTypes?: string[]
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  minSquareFeet?: number
  maxSquareFeet?: number
  minYearBuilt?: number
  maxYearBuilt?: number
  minEstimatedValue?: number
  maxEstimatedValue?: number
  loanTypes?: string[]
  minLoanAmount?: number
  maxLoanAmount?: number
  minInterestRate?: number
  maxInterestRate?: number
  minAge?: number
  maxAge?: number
  minIncome?: number
  maxIncome?: number
  homeOwnership?: string[]
  maritalStatus?: string[]
  foreclosureStatus?: string[]
  likelyToMove?: boolean
  likelyToSell?: boolean
  likelyToRefinance?: boolean
  minMotivationScore?: number
  maxMotivationScore?: number
  limit?: number
  offset?: number
}

/**
 * Convert our list criteria to AccuZIP search parameters
 */
export function criteriaToAccuZIPParams(criteria: ListCriteria): AccuZIPSearchParams {
  const params: AccuZIPSearchParams = {}

  // Geography
  if (criteria.geography) {
    if (criteria.geography.states?.length) {
      params.states = criteria.geography.states
    }
    if (criteria.geography.cities?.length) {
      params.cities = criteria.geography.cities
    }
    if (criteria.geography.zipCodes?.length) {
      params.zipCodes = criteria.geography.zipCodes
    }
    if (criteria.geography.counties?.length) {
      params.counties = criteria.geography.counties
    }
  }

  // Property
  if (criteria.property) {
    if (criteria.property.propertyTypes?.length) {
      params.propertyTypes = criteria.property.propertyTypes
    }
    if (criteria.property.bedrooms?.length) {
      params.minBedrooms = criteria.property.bedrooms[0]
      params.maxBedrooms = criteria.property.bedrooms[1]
    }
    if (criteria.property.bathrooms?.length) {
      params.minBathrooms = criteria.property.bathrooms[0]
      params.maxBathrooms = criteria.property.bathrooms[1]
    }
    if (criteria.property.squareFootage?.length) {
      params.minSquareFeet = criteria.property.squareFootage[0]
      params.maxSquareFeet = criteria.property.squareFootage[1]
    }
    if (criteria.property.yearBuilt?.length) {
      params.minYearBuilt = criteria.property.yearBuilt[0]
      params.maxYearBuilt = criteria.property.yearBuilt[1]
    }
    if (criteria.property.propertyValue?.length) {
      params.minEstimatedValue = criteria.property.propertyValue[0]
      params.maxEstimatedValue = criteria.property.propertyValue[1]
    }
  }

  // Mortgage
  if (criteria.mortgage) {
    if (criteria.mortgage.primaryLoanType?.length) {
      params.loanTypes = criteria.mortgage.primaryLoanType
    }
    if (criteria.mortgage.mortgageAmount) {
      params.minLoanAmount = criteria.mortgage.mortgageAmount.min
      params.maxLoanAmount = criteria.mortgage.mortgageAmount.max
    }
    if (criteria.mortgage.interestRate) {
      params.minInterestRate = criteria.mortgage.interestRate.min
      params.maxInterestRate = criteria.mortgage.interestRate.max
    }
  }

  // Demographics
  if (criteria.demographics) {
    if (criteria.demographics.age?.length) {
      const [minAge, maxAge] = criteria.demographics.age
      if (minAge !== undefined) params.minAge = minAge
      if (maxAge !== undefined) params.maxAge = maxAge
    }
    if (criteria.demographics.income?.length) {
      const [minIncome, maxIncome] = criteria.demographics.income
      if (minIncome !== undefined) params.minIncome = minIncome
      if (maxIncome !== undefined) params.maxIncome = maxIncome
    }
    if (criteria.demographics.homeOwnership?.length) {
      params.homeOwnership = criteria.demographics.homeOwnership
    }
    if (criteria.demographics.maritalStatus?.length) {
      params.maritalStatus = criteria.demographics.maritalStatus
    }
  }

  // Foreclosure
  if (criteria.foreclosure) {
    if (criteria.foreclosure.foreclosureStatus?.length) {
      params.foreclosureStatus = criteria.foreclosure.foreclosureStatus
    }
  }

  // Predictive Analytics
  // Note: current PredictiveCriteria in types/list-builder.ts does not include fields
  // like likelyToMove/likelyToSell. When such fields are added, map them here.

  return params
}
