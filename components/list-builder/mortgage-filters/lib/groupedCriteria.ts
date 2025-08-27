// Grouped criteria logic for mortgage filters
import { MORTGAGE_CRITERIA_OPTIONS } from "./constants"

export const groupedCriteria = MORTGAGE_CRITERIA_OPTIONS.reduce(
  (acc, option) => {
    if (!acc[option.category]) acc[option.category] = []
    acc[option.category].push(option)
    return acc
  },
  {} as Record<string, typeof MORTGAGE_CRITERIA_OPTIONS>,
)
