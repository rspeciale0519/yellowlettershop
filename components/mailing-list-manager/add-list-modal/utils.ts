import { findBestMatch } from "@/utils/string-similarity"
import type { ColumnMapping } from "./types"
import { PREDEFINED_FIELDS } from "./types"

export const validateFile = (file: File): string | null => {
  // Check file size (50MB limit)
  if (file.size > 50 * 1024 * 1024) {
    return "File is too large. Maximum size is 50MB."
  }

  // Check file type
  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]
  if (!validTypes.includes(file.type)) {
    return "Invalid file type. Please upload a CSV or Excel file."
  }

  return null
}

export const autoMatchColumns = (headers: string[]): Record<string, ColumnMapping> => {
  const newMappings: Record<string, ColumnMapping> = {}
  const predefinedLabels = PREDEFINED_FIELDS.map((f) => f.label)

  headers.forEach((header) => {
    // Try to find the best match among predefined fields
    const { match, similarity } = findBestMatch(header, predefinedLabels)

    // Get the field ID from the matched label
    const matchedField = PREDEFINED_FIELDS.find((f) => f.label === match)

    // If similarity is high enough, use the predefined field, otherwise exclude column
    const fieldId = similarity >= 70 && matchedField ? matchedField.id : "ignore"

    newMappings[header] = {
      fieldId,
      customName: fieldId === "custom" ? header : undefined,
      confidence: similarity, // Store the confidence score
    }
  })

  return newMappings
}

export const generateMockPreviewData = () => {
  // Mock column headers - using more realistic headers to demonstrate matching
  const mockHeaders = [
    "First Name",
    "Last Name", 
    "Street Address",
    "City Name",
    "ST",
    "Postal Code",
    "Email Address",
    "Phone Number",
    "Custom Field 1",
  ]

  // Mock preview data (first 5 rows)
  const mockPreviewData = [
    ["John", "Doe", "123 Main St", "New York", "NY", "10001", "john@example.com", "555-123-4567", "Value 1"],
    ["Jane", "Smith", "456 Oak Ave", "Los Angeles", "CA", "90001", "jane@example.com", "555-234-5678", "Value 2"],
    ["Bob", "Johnson", "789 Pine Rd", "Chicago", "IL", "60601", "bob@example.com", "555-345-6789", "Value 3"],
    ["Alice", "Williams", "321 Elm Blvd", "Houston", "TX", "77001", "alice@example.com", "555-456-7890", "Value 4"],
    ["Charlie", "Brown", "654 Maple Dr", "Phoenix", "AZ", "85001", "charlie@example.com", "555-567-8901", "Value 5"],
  ]

  return [mockHeaders, ...mockPreviewData]
}
