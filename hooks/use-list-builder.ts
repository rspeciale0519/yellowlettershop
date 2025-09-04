import { useState, useCallback } from 'react'
import { ListBuilderCriteria } from '@/types/supabase'
import { ListBuilderRequest } from '@/lib/list-builder/list-builder-service'

export interface ListBuilderEstimate {
  estimatedCount: number
  estimatedCost: number
  isValid: boolean
  errors: string[]
}

export interface ListBuilderResult {
  success: boolean
  mailingList?: any
  recordCount: number
  estimatedCost?: number
  error?: string
}

export interface ListBuilderUsageStats {
  totalListsBuilt: number
  totalRecordsGenerated: number
  totalCost: number
  averageListSize: number
}

export function useListBuilder() {
  const [isEstimating, setIsEstimating] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [estimate, setEstimate] = useState<ListBuilderEstimate | null>(null)

  const estimateList = useCallback(async (criteria: ListBuilderCriteria): Promise<ListBuilderEstimate> => {
    setIsEstimating(true)
    try {
      const response = await fetch('/api/list-builder/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ criteria }),
      })

      if (!response.ok) {
        throw new Error('Failed to estimate list')
      }

      const result = await response.json()
      setEstimate(result)
      return result
    } catch (error) {
      const errorResult: ListBuilderEstimate = {
        estimatedCount: 0,
        estimatedCost: 0,
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
      setEstimate(errorResult)
      return errorResult
    } finally {
      setIsEstimating(false)
    }
  }, [])

  const buildList = useCallback(async (request: ListBuilderRequest): Promise<ListBuilderResult> => {
    setIsBuilding(true)
    try {
      const response = await fetch('/api/list-builder/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to build list')
      }

      return result
    } catch (error) {
      return {
        success: false,
        recordCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } finally {
      setIsBuilding(false)
    }
  }, [])

  const getUsageStats = useCallback(async (userId?: string): Promise<ListBuilderUsageStats> => {
    try {
      const url = userId ? `/api/list-builder/usage?userId=${userId}` : '/api/list-builder/usage'
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to get usage stats')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return {
        totalListsBuilt: 0,
        totalRecordsGenerated: 0,
        totalCost: 0,
        averageListSize: 0
      }
    }
  }, [])

  const clearEstimate = useCallback(() => {
    setEstimate(null)
  }, [])

  return {
    estimate,
    isEstimating,
    isBuilding,
    estimateList,
    buildList,
    getUsageStats,
    clearEstimate
  }
}
