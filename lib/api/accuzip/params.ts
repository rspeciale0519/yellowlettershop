// AccuZIP parameter conversion utilities
import type { ListCriteria } from '@/lib/supabase/mailing-lists';

interface AccuZIPSearchParams {
  states?: string[];
  cities?: string[];
  zipCodes?: string[];
  counties?: string[];
  propertyTypes?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minEstimatedValue?: number;
  maxEstimatedValue?: number;
  loanTypes?: string[];
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  minAge?: number;
  maxAge?: number;
  minIncome?: number;
  maxIncome?: number;
  homeOwnership?: string[];
  maritalStatus?: string[];
  foreclosureStatus?: string[];
  likelyToMove?: boolean;
  likelyToSell?: boolean;
  likelyToRefinance?: boolean;
  minMotivationScore?: number;
  maxMotivationScore?: number;
  limit?: number;
  offset?: number;
}

/**
 * Convert our list criteria to AccuZIP search parameters
 */
export function criteriaToAccuZIPParams(
  criteria: ListCriteria
): AccuZIPSearchParams {
  const params: AccuZIPSearchParams = {};

  // Geography
  if (criteria.geography) {
    if (criteria.geography.states?.length) {
      params.states = criteria.geography.states;
    }
    if (criteria.geography.cities?.length) {
      params.cities = criteria.geography.cities;
    }
    if (criteria.geography.zipCodes?.length) {
      params.zipCodes = criteria.geography.zipCodes;
    }
    if (criteria.geography.counties?.length) {
      params.counties = criteria.geography.counties;
    }
  }

  // Property
  if (criteria.property) {
    if (criteria.property.propertyTypes?.length) {
      params.propertyTypes = criteria.property.propertyTypes;
    }
    if (criteria.property.bedrooms?.length) {
      const [minBedrooms, maxBedrooms] = criteria.property.bedrooms;
      if (minBedrooms !== undefined) params.minBedrooms = minBedrooms;
      if (maxBedrooms !== undefined) params.maxBedrooms = maxBedrooms;
    }
    if (criteria.property.bathrooms?.length) {
      const [minBathrooms, maxBathrooms] = criteria.property.bathrooms;
      if (minBathrooms !== undefined) params.minBathrooms = minBathrooms;
      if (maxBathrooms !== undefined) params.maxBathrooms = maxBathrooms;
    }
    if (criteria.property.squareFootage?.length) {
      const [minSquareFeet, maxSquareFeet] = criteria.property.squareFootage;
      if (minSquareFeet !== undefined) params.minSquareFeet = minSquareFeet;
      if (maxSquareFeet !== undefined) params.maxSquareFeet = maxSquareFeet;
    }
    if (criteria.property.yearBuilt?.length) {
      const [minYearBuilt, maxYearBuilt] = criteria.property.yearBuilt;
      if (minYearBuilt !== undefined) params.minYearBuilt = minYearBuilt;
      if (maxYearBuilt !== undefined) params.maxYearBuilt = maxYearBuilt;
    }
    if (criteria.property.propertyValue?.length) {
      const [minEstimatedValue, maxEstimatedValue] =
        criteria.property.propertyValue;
      if (minEstimatedValue !== undefined)
        params.minEstimatedValue = minEstimatedValue;
      if (maxEstimatedValue !== undefined)
        params.maxEstimatedValue = maxEstimatedValue;
    }
  }

  // Mortgage
  if (criteria.mortgage) {
    if (criteria.mortgage.primaryLoanType?.length) {
      params.loanTypes = criteria.mortgage.primaryLoanType;
    }
  }

  // Demographics
  if (criteria.demographics) {
    if (criteria.demographics.age?.length) {
      let [minAge, maxAge] = criteria.demographics.age;
      if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
        [minAge, maxAge] = [maxAge, minAge];
      }
      if (minAge !== undefined) params.minAge = minAge;
      if (maxAge !== undefined) params.maxAge = maxAge;
    }
    if (criteria.demographics.income?.length) {
      let [minIncome, maxIncome] = criteria.demographics.income;
      if (minIncome !== undefined && maxIncome !== undefined && minIncome > maxIncome) {
        [minIncome, maxIncome] = [maxIncome, minIncome];
      }
      if (minIncome !== undefined) params.minIncome = minIncome;
      if (maxIncome !== undefined) params.maxIncome = maxIncome;
    }
    if (criteria.demographics.homeOwnership?.length) {
      params.homeOwnership = criteria.demographics.homeOwnership;
    }
    if (criteria.demographics.maritalStatus?.length) {
      params.maritalStatus = criteria.demographics.maritalStatus;
    }
  }

  // Foreclosure
  if (criteria.foreclosure) {
    if (criteria.foreclosure.foreclosureStatus?.length) {
      params.foreclosureStatus = criteria.foreclosure.foreclosureStatus;
    }
  }

  // Predictive Analytics
  // Note: current PredictiveCriteria in types/list-builder.ts does not include fields
  // like likelyToMove/likelyToSell. When such fields are added, map them here.

  return params;
}
