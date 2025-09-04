import { useState, useCallback } from 'react'
import { Campaign } from '@/types/supabase'
import { 
  CreateCampaignRequest, 
  CampaignExecution,
  SplitCampaignConfig,
  RecurringCampaignConfig,
  CampaignDependency
} from '@/lib/campaigns/enhanced-campaign-service'

export function useEnhancedCampaigns() {
  const [isLoading, setIsLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [executions, setExecutions] = useState<CampaignExecution[]>([])

  const createCampaign = useCallback(async (request: CreateCampaignRequest): Promise<Campaign> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/campaigns/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      const campaign = await response.json()
      setCampaigns(prev => [campaign, ...prev])
      return campaign
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateCampaign = useCallback(async (
    campaignId: string,
    updates: Partial<CreateCampaignRequest>
  ): Promise<Campaign> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/campaigns/enhanced', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId, ...updates }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update campaign')
      }

      const campaign = await response.json()
      setCampaigns(prev => prev.map(c => c.id === campaignId ? campaign : c))
      return campaign
    } finally {
      setIsLoading(false)
    }
  }, [])

  const executeCampaign = useCallback(async (
    campaignId: string,
    executionId?: string
  ): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ executionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to execute campaign')
      }

      // Refresh executions after successful execution
      await getCampaignExecutions(campaignId)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getCampaignExecutions = useCallback(async (campaignId: string): Promise<CampaignExecution[]> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/executions`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get campaign executions')
      }

      const campaignExecutions = await response.json()
      setExecutions(campaignExecutions)
      return campaignExecutions
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cancelExecution = useCallback(async (
    campaignId: string,
    executionId: string
  ): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/executions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ executionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel execution')
      }

      // Update local state
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, status: 'cancelled' as const }
          : exec
      ))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSplitCampaign = useCallback(async (
    baseRequest: Omit<CreateCampaignRequest, 'splitConfig'>,
    splitConfig: SplitCampaignConfig
  ): Promise<Campaign> => {
    return await createCampaign({
      ...baseRequest,
      splitConfig
    })
  }, [createCampaign])

  const createRecurringCampaign = useCallback(async (
    baseRequest: Omit<CreateCampaignRequest, 'recurringConfig'>,
    recurringConfig: RecurringCampaignConfig
  ): Promise<Campaign> => {
    return await createCampaign({
      ...baseRequest,
      recurringConfig
    })
  }, [createCampaign])

  const createDependentCampaign = useCallback(async (
    baseRequest: Omit<CreateCampaignRequest, 'dependencies'>,
    dependencies: CampaignDependency[]
  ): Promise<Campaign> => {
    return await createCampaign({
      ...baseRequest,
      dependencies
    })
  }, [createCampaign])

  return {
    campaigns,
    executions,
    isLoading,
    createCampaign,
    updateCampaign,
    executeCampaign,
    getCampaignExecutions,
    cancelExecution,
    createSplitCampaign,
    createRecurringCampaign,
    createDependentCampaign
  }
}
