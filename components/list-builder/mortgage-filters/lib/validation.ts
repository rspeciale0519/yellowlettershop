import { isValid, parseISO } from "date-fns"

export const validateMortgageAmount = (min: number, max: number): string | null => {
  if (min < 1000) return "Minimum amount must be at least $1,000"
  if (max > 50000000) return "Maximum amount cannot exceed $50,000,000"
  if (min >= max) return "Minimum must be less than maximum"
  return null
}

export const validateInterestRate = (min: number, max: number): string | null => {
  if (min < 0.001) return "Minimum rate must be at least 0.001%"
  if (max > 30) return "Maximum rate cannot exceed 30%"
  if (min >= max) return "Minimum must be less than maximum"
  return null
}

export const validateDateRange = (from: string | undefined, to: string | undefined): string | null => {
  if (!from || !to) return "Both start and end dates are required"
  const fromDate = parseISO(from)
  const toDate = parseISO(to)
  if (!isValid(fromDate) || !isValid(toDate)) return "Invalid date format"
  if (fromDate >= toDate) return "Start date must be before end date"
  return null
}
