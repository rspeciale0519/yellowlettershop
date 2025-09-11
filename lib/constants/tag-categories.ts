/**
 * Tag Categories Configuration
 * 
 * To add/edit/delete tag categories:
 * 1. Modify the TAG_CATEGORIES array below
 * 2. The changes will automatically apply across the entire application
 * 3. Categories are used in dropdowns and filtering throughout the tag system
 */

export const TAG_CATEGORIES = [
  'system',           // System-generated tags
  'list_management',  // Mailing list organization
  'demographics',     // Age, income, gender, etc.
  'geography',        // Location-based tags
  'campaign',         // Campaign-specific tags
  'custom'           // User-defined categories
] as const

export type TagCategory = typeof TAG_CATEGORIES[number]

/**
 * Category Display Names
 * Maps internal category names to user-friendly display names
 */
export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'system': 'System',
  'list_management': 'List Management',
  'demographics': 'Demographics', 
  'geography': 'Geography',
  'campaign': 'Campaign',
  'custom': 'Custom'
}

/**
 * Category Descriptions
 * Helpful descriptions for each category
 */
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'system': 'Auto-generated tags by the system',
  'list_management': 'Tags for organizing mailing lists',
  'demographics': 'Age, income, gender, and demographic data',
  'geography': 'Location-based and geographic tags',
  'campaign': 'Campaign-specific and marketing tags',
  'custom': 'User-defined custom categories'
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1)
}

/**
 * Get description for a category
 */
export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] || ''
}