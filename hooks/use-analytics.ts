import { useState, useCallback } from 'react'
import { EngagementMetrics } from '@/lib/analytics/engagement-tracker'

export interface PerformanceMetrics {
  totalCampaigns: number
  totalShortLinks: number
  totalClicks: number
  averageCTR: number
  topPerformingCampaigns: Array<{
    campaignId: string
    campaignName: string
    clicks: number
    ctr: number
  }>
}

export interface ShortLinkOptions {
  campaignId?: string
  recipientId?: string
  customAlias?: string
  expiresAt?: string
  trackingEnabled?: boolean
}

export function useAnalytics() {
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)

  const createShortLink = useCallback(async (
    originalUrl: string,
    options: ShortLinkOptions = {}
  ) => {
    try {
      const response = await fetch('/api/analytics/short-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl, options }),
      })

      if (!response.ok) {
        throw new Error('Failed to create short link')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating short link:', error)
      throw error
    }
  }, [])

  const getCampaignMetrics = useCallback(async (campaignId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/short-links?campaignId=${campaignId}`)

      if (!response.ok) {
        throw new Error('Failed to get campaign metrics')
      }

      const data = await response.json()
      setMetrics(data)
      return data
    } catch (error) {
      console.error('Error getting campaign metrics:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getPerformanceMetrics = useCallback(async (userId?: string) => {
    setIsLoading(true)
    try {
      const url = userId ? `/api/analytics/performance?userId=${userId}` : '/api/analytics/performance'
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to get performance metrics')
      }

      const data = await response.json()
      setPerformanceMetrics(data)
      return data
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const recordEngagementEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any>,
    campaignId?: string,
    recipientId?: string
  ) => {
    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          eventData,
          campaignId,
          recipientId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to record engagement event')
      }

      return await response.json()
    } catch (error) {
      console.error('Error recording engagement event:', error)
      throw error
    }
  }, [])

  return {
    metrics,
    performanceMetrics,
    isLoading,
    createShortLink,
    getCampaignMetrics,
    getPerformanceMetrics,
    recordEngagementEvent
  }
}
