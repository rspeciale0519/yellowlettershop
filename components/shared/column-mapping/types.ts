// Shared types for column mapping functionality
export interface ColumnMappingData {
  sourceColumns: string[]
  mappedFields: Record<string, string | null>
  previewData: any[]
  requiredFields: string[]
  optionalFields: string[]
  isComplete?: boolean
  recordCount?: number
}

export interface YLSField {
  key: string
  label: string
  required: boolean
  type: 'text' | 'number' | 'email' | 'phone' | 'address'
  description?: string
  example?: string
}

export interface MappingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  requiredFieldsMapped: boolean
}

export interface ColumnStatistics {
  columnName: string
  totalRows: number
  filledRows: number
  emptyRows: number
  uniqueValues: number
  sampleValues: string[]
  dataType: 'text' | 'number' | 'email' | 'phone' | 'address' | 'mixed'
  completeness: number // percentage 0-100
}

export interface MappingHistory {
  id: string
  timestamp: number
  action: 'map' | 'unmap' | 'auto-map' | 'clear-all'
  fieldKey: string
  oldValue: string | null
  newValue: string | null
}

export interface MappingTemplate {
  id: string
  name: string
  description?: string
  mappings: Record<string, string | null>
  createdAt: number
  usageCount: number
}

export interface ColumnMappingProps {
  sourceFile?: File
  sourceData?: any[]
  onMappingComplete: (data: ColumnMappingData) => void
  onCancel: () => void
  mode: 'order-workflow' | 'mlm-import'
  listId?: string
  listName?: string
}

// Standard YLS field definitions
export const YLS_FIELDS: YLSField[] = [
  // Required fields
  {
    key: 'first_name',
    label: 'First Name',
    required: true,
    type: 'text',
    description: 'Recipient\'s first name for personalization',
    example: 'John'
  },
  {
    key: 'last_name',
    label: 'Last Name',
    required: true,
    type: 'text',
    description: 'Recipient\'s last name for personalization',
    example: 'Smith'
  },
  {
    key: 'address_line_1',
    label: 'Address Line 1',
    required: true,
    type: 'address',
    description: 'Primary street address for mail delivery',
    example: '123 Main Street'
  },
  {
    key: 'city',
    label: 'City',
    required: true,
    type: 'text',
    description: 'City name for mail delivery',
    example: 'Los Angeles'
  },
  {
    key: 'state',
    label: 'State',
    required: true,
    type: 'text',
    description: 'State abbreviation (2 letters)',
    example: 'CA'
  },
  {
    key: 'zip_code',
    label: 'ZIP Code',
    required: true,
    type: 'text',
    description: 'ZIP or postal code for mail delivery',
    example: '90210'
  },

  // Optional fields
  {
    key: 'address_line_2',
    label: 'Address Line 2',
    required: false,
    type: 'address',
    description: 'Apartment, suite, or unit number',
    example: 'Apt 4B'
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'email',
    description: 'Email address for digital follow-up',
    example: 'john@example.com'
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    type: 'phone',
    description: 'Phone number for follow-up',
    example: '(555) 123-4567'
  },
  {
    key: 'company',
    label: 'Company',
    required: false,
    type: 'text',
    description: 'Company or business name',
    example: 'Acme Corp'
  },
  {
    key: 'property_type',
    label: 'Property Type',
    required: false,
    type: 'text',
    description: 'Type of property owned',
    example: 'Single Family'
  },
  {
    key: 'bedrooms',
    label: 'Bedrooms',
    required: false,
    type: 'number',
    description: 'Number of bedrooms in property',
    example: '3'
  },
  {
    key: 'bathrooms',
    label: 'Bathrooms',
    required: false,
    type: 'number',
    description: 'Number of bathrooms in property',
    example: '2.5'
  },
  {
    key: 'square_feet',
    label: 'Square Feet',
    required: false,
    type: 'number',
    description: 'Total square footage of property',
    example: '2500'
  },
  {
    key: 'year_built',
    label: 'Year Built',
    required: false,
    type: 'number',
    description: 'Year the property was built',
    example: '1995'
  },
  {
    key: 'estimated_value',
    label: 'Estimated Value',
    required: false,
    type: 'number',
    description: 'Estimated property value',
    example: '450000'
  },
  {
    key: 'loan_amount',
    label: 'Loan Amount',
    required: false,
    type: 'number',
    description: 'Outstanding loan amount',
    example: '350000'
  },
  {
    key: 'loan_type',
    label: 'Loan Type',
    required: false,
    type: 'text',
    description: 'Type of loan or mortgage',
    example: 'Conventional'
  },
  {
    key: 'interest_rate',
    label: 'Interest Rate',
    required: false,
    type: 'number',
    description: 'Current interest rate percentage',
    example: '4.25'
  },
  {
    key: 'age',
    label: 'Age',
    required: false,
    type: 'number',
    description: 'Age of property owner',
    example: '45'
  },
  {
    key: 'income',
    label: 'Income',
    required: false,
    type: 'number',
    description: 'Annual household income',
    example: '75000'
  },
  {
    key: 'marital_status',
    label: 'Marital Status',
    required: false,
    type: 'text',
    description: 'Marital status of property owner',
    example: 'Married'
  },
]

export const REQUIRED_FIELDS = YLS_FIELDS.filter(field => field.required).map(field => field.key)
export const OPTIONAL_FIELDS = YLS_FIELDS.filter(field => !field.required).map(field => field.key)