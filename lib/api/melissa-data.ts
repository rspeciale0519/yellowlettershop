import { ListBuilderCriteria } from '@/types/supabase'

export interface MelissaDataConfig {
  apiKey: string
  baseUrl: string
}

export interface MelissaDataListRequest {
  criteria: Record<string, any>
  maxRecords?: number
  format?: 'json' | 'csv'
  includeHeaders?: boolean
}

export interface MelissaDataRecord {
  first_name: string
  last_name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone?: string
  email?: string
  age?: number
  income?: number
  home_value?: number
  property_type?: string
  [key: string]: any
}

export interface MelissaDataResponse {
  success: boolean
  recordCount: number
  records: MelissaDataRecord[]
  estimatedTotal?: number
  error?: string
}

/**
 * MelissaData API client for list building
 */
export class MelissaDataClient {
  private config: MelissaDataConfig

  constructor(config: MelissaDataConfig) {
    this.config = config
  }

  /**
   * Estimates record count for given criteria
   */
  async estimateCount(criteria: Record<string, any>): Promise<number> {
    try {
      const response = await fetch(`${this.config.baseUrl}/list/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ criteria })
      })

      if (!response.ok) {
        throw new Error(`MelissaData API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.estimatedCount || 0
    } catch (error) {
      console.error('MelissaData estimate error:', error)
      return 0
    }
  }

  /**
   * Builds a mailing list from criteria
   */
  async buildList(request: MelissaDataListRequest): Promise<MelissaDataResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/list/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          recordCount: 0,
          records: [],
          error: `API Error: ${response.status} - ${errorText}`
        }
      }

      const data = await response.json()
      return {
        success: true,
        recordCount: data.records?.length || 0,
        records: data.records || [],
        estimatedTotal: data.estimatedTotal
      }
    } catch (error) {
      return {
        success: false,
        recordCount: 0,
        records: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validates addresses in a list
   */
  async validateAddresses(records: MelissaDataRecord[]): Promise<MelissaDataRecord[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/address/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ records })
      })

      if (!response.ok) {
        throw new Error(`Address validation error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.validatedRecords || records
    } catch (error) {
      console.error('Address validation error:', error)
      return records // Return original records if validation fails
    }
  }
}

/**
 * Creates MelissaData client instance
 */
export function createMelissaDataClient(): MelissaDataClient {
  const config: MelissaDataConfig = {
    apiKey: process.env.MELISSA_DATA_API_KEY || '',
    baseUrl: process.env.MELISSA_DATA_BASE_URL || 'https://api.melissadata.com/v1'
  }

  if (!config.apiKey) {
    throw new Error('MELISSA_DATA_API_KEY environment variable is required')
  }

  return new MelissaDataClient(config)
}

/**
 * Utility function to convert MelissaData records to our format
 */
export function convertMelissaDataRecords(records: MelissaDataRecord[]): Record<string, any>[] {
  return records.map(record => ({
    first_name: record.first_name,
    last_name: record.last_name,
    address: record.address,
    city: record.city,
    state: record.state,
    zip_code: record.zip_code,
    phone: record.phone,
    email: record.email,
    additional_data: {
      age: record.age,
      income: record.income,
      home_value: record.home_value,
      property_type: record.property_type,
      // Store any additional fields in additional_data JSONB
      ...Object.fromEntries(
        Object.entries(record).filter(([key]) => 
          !['first_name', 'last_name', 'address', 'city', 'state', 'zip_code', 'phone', 'email'].includes(key)
        )
      )
    }
  }))
}
