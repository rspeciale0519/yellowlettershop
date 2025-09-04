import { createClient } from '@/utils/supabase/client'
import { ShortLinkTracking, EngagementEvent } from '@/types/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface EngagementMetrics {
  totalClicks: number
  uniqueClicks: number
  clickThroughRate: number
  engagementRate: number
  topLocations: Array<{ location: string; clicks: number }>
  deviceBreakdown: Array<{ device: string; clicks: number }>
  timeSeriesData: Array<{ date: string; clicks: number }>
}

export interface ShortLinkOptions {
  campaignId?: string
  recipientId?: string
  customAlias?: string
  expiresAt?: string
  trackingEnabled?: boolean
}

/**
 * Service for tracking engagement and managing short links
 */
export class EngagementTracker {
  private supabase = createClient()

  /**
   * Creates a short link for tracking
   */
  async createShortLink(
    originalUrl: string,
    options: ShortLinkOptions = {}
  ): Promise<ShortLinkTracking | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const shortCode = options.customAlias || this.generateShortCode()
    const shortLinkData = {
      id: uuidv4(),
      user_id: user.id,
      campaign_id: options.campaignId,
      recipient_id: options.recipientId,
      original_url: originalUrl,
      short_code: shortCode,
      short_url: `${process.env.NEXT_PUBLIC_BASE_URL}/s/${shortCode}`,
      click_count: 0,
      unique_click_count: 0,
      is_active: true,
      expires_at: options.expiresAt,
      tracking_enabled: options.trackingEnabled ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('short_link_tracking')
      .insert(shortLinkData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Records a click event for a short link
   */
  async recordClick(
    shortCode: string,
    clickData: {
      ipAddress?: string
      userAgent?: string
      referer?: string
      location?: string
      device?: string
    }
  ): Promise<{ redirectUrl: string | null; success: boolean }> {
    try {
      // Get short link
      const { data: shortLink, error: linkError } = await this.supabase
        .from('short_link_tracking')
        .select('*')
        .eq('short_code', shortCode)
        .eq('is_active', true)
        .single()

      if (linkError || !shortLink) {
        return { redirectUrl: null, success: false }
      }

      // Check if expired
      if (shortLink.expires_at && new Date(shortLink.expires_at) < new Date()) {
        return { redirectUrl: null, success: false }
      }

      // Record engagement event if tracking enabled
      if (shortLink.tracking_enabled) {
        const eventData = {
          id: uuidv4(),
          user_id: shortLink.user_id,
          campaign_id: shortLink.campaign_id,
          recipient_id: shortLink.recipient_id,
          event_type: 'click' as const,
          event_data: {
            short_link_id: shortLink.id,
            ip_address: clickData.ipAddress,
            user_agent: clickData.userAgent,
            referer: clickData.referer,
            location: clickData.location,
            device: clickData.device
          },
          created_at: new Date().toISOString()
        }

        await this.supabase
          .from('engagement_events')
          .insert(eventData)

        // Update click counts
        const isUniqueClick = await this.isUniqueClick(shortLink.id, clickData.ipAddress)
        
        await this.supabase
          .from('short_link_tracking')
          .update({
            click_count: shortLink.click_count + 1,
            unique_click_count: shortLink.unique_click_count + (isUniqueClick ? 1 : 0),
            last_clicked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', shortLink.id)
      }

      return { redirectUrl: shortLink.original_url, success: true }

    } catch (error) {
      console.error('Error recording click:', error)
      return { redirectUrl: null, success: false }
    }
  }

  /**
   * Gets engagement metrics for a campaign
   */
  async getCampaignMetrics(campaignId: string): Promise<EngagementMetrics> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    try {
      // Get short links for campaign
      const { data: shortLinks } = await this.supabase
        .from('short_link_tracking')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)

      if (!shortLinks || shortLinks.length === 0) {
        return this.getEmptyMetrics()
      }

      const shortLinkIds = shortLinks.map(link => link.id)

      // Get engagement events
      const { data: events } = await this.supabase
        .from('engagement_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .eq('event_type', 'click')
        .order('created_at', { ascending: false })

      const totalClicks = shortLinks.reduce((sum, link) => sum + link.click_count, 0)
      const uniqueClicks = shortLinks.reduce((sum, link) => sum + link.unique_click_count, 0)

      // Calculate location breakdown
      const locationCounts: Record<string, number> = {}
      const deviceCounts: Record<string, number> = {}
      const dailyCounts: Record<string, number> = {}

      events?.forEach(event => {
        const location = event.event_data?.location || 'Unknown'
        const device = event.event_data?.device || 'Unknown'
        const date = new Date(event.created_at).toISOString().split('T')[0]

        locationCounts[location] = (locationCounts[location] || 0) + 1
        deviceCounts[device] = (deviceCounts[device] || 0) + 1
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      return {
        totalClicks,
        uniqueClicks,
        clickThroughRate: this.calculateCTR(totalClicks, shortLinks.length),
        engagementRate: this.calculateEngagementRate(uniqueClicks, shortLinks.length),
        topLocations: Object.entries(locationCounts)
          .map(([location, clicks]) => ({ location, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10),
        deviceBreakdown: Object.entries(deviceCounts)
          .map(([device, clicks]) => ({ device, clicks }))
          .sort((a, b) => b.clicks - a.clicks),
        timeSeriesData: Object.entries(dailyCounts)
          .map(([date, clicks]) => ({ date, clicks }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }

    } catch (error) {
      console.error('Error getting campaign metrics:', error)
      return this.getEmptyMetrics()
    }
  }

  /**
   * Gets performance metrics for a user
   */
  async getUserPerformanceMetrics(userId?: string): Promise<{
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
  }> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return {
        totalCampaigns: 0,
        totalShortLinks: 0,
        totalClicks: 0,
        averageCTR: 0,
        topPerformingCampaigns: []
      }
    }

    try {
      // Get all short links for user
      const { data: shortLinks } = await this.supabase
        .from('short_link_tracking')
        .select(`
          *,
          campaigns (
            id,
            name
          )
        `)
        .eq('user_id', targetUserId)

      if (!shortLinks || shortLinks.length === 0) {
        return {
          totalCampaigns: 0,
          totalShortLinks: 0,
          totalClicks: 0,
          averageCTR: 0,
          topPerformingCampaigns: []
        }
      }

      const totalClicks = shortLinks.reduce((sum, link) => sum + link.click_count, 0)
      const uniqueCampaigns = new Set(shortLinks.map(link => link.campaign_id).filter(Boolean))

      // Calculate campaign performance
      const campaignPerformance: Record<string, {
        name: string
        clicks: number
        linkCount: number
      }> = {}

      shortLinks.forEach(link => {
        if (link.campaign_id) {
          if (!campaignPerformance[link.campaign_id]) {
            campaignPerformance[link.campaign_id] = {
              name: link.campaigns?.name || 'Unknown Campaign',
              clicks: 0,
              linkCount: 0
            }
          }
          campaignPerformance[link.campaign_id].clicks += link.click_count
          campaignPerformance[link.campaign_id].linkCount += 1
        }
      })

      const topPerformingCampaigns = Object.entries(campaignPerformance)
        .map(([campaignId, data]) => ({
          campaignId,
          campaignName: data.name,
          clicks: data.clicks,
          ctr: this.calculateCTR(data.clicks, data.linkCount)
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)

      return {
        totalCampaigns: uniqueCampaigns.size,
        totalShortLinks: shortLinks.length,
        totalClicks,
        averageCTR: this.calculateCTR(totalClicks, shortLinks.length),
        topPerformingCampaigns
      }

    } catch (error) {
      console.error('Error getting user performance metrics:', error)
      return {
        totalCampaigns: 0,
        totalShortLinks: 0,
        totalClicks: 0,
        averageCTR: 0,
        topPerformingCampaigns: []
      }
    }
  }

  /**
   * Records a custom engagement event
   */
  async recordEngagementEvent(
    eventType: string,
    eventData: Record<string, any>,
    campaignId?: string,
    recipientId?: string
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const event = {
      id: uuidv4(),
      user_id: user.id,
      campaign_id: campaignId,
      recipient_id: recipientId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('engagement_events')
      .insert(event)

    if (error) throw error
  }

  // Private helper methods

  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private async isUniqueClick(shortLinkId: string, ipAddress?: string): Promise<boolean> {
    if (!ipAddress) return true

    const { data } = await this.supabase
      .from('engagement_events')
      .select('id')
      .eq('event_type', 'click')
      .eq('event_data->short_link_id', shortLinkId)
      .eq('event_data->ip_address', ipAddress)
      .limit(1)

    return !data || data.length === 0
  }

  private calculateCTR(clicks: number, opportunities: number): number {
    if (opportunities === 0) return 0
    return (clicks / opportunities) * 100
  }

  private calculateEngagementRate(uniqueClicks: number, opportunities: number): number {
    if (opportunities === 0) return 0
    return (uniqueClicks / opportunities) * 100
  }

  private getEmptyMetrics(): EngagementMetrics {
    return {
      totalClicks: 0,
      uniqueClicks: 0,
      clickThroughRate: 0,
      engagementRate: 0,
      topLocations: [],
      deviceBreakdown: [],
      timeSeriesData: []
    }
  }
}
