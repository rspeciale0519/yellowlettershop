import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('API Integration Tests', () => {
  let supabase: any
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: `api-test-${uuidv4()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    testUser = user.user

    // Get auth token for API calls
    const { data: session } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testUser.email
    })
    authToken = session.properties?.access_token || ''
  })

  afterAll(async () => {
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id)
    }
  })

  describe('List Builder API', () => {
    it('should estimate list build correctly', async () => {
      const criteria = {
        demographic: {
          age_range: [25, 65],
          income_range: [50000, 150000]
        },
        geographic: {
          states: ['CA', 'TX'],
          cities: ['Los Angeles', 'Houston']
        },
        property: {
          property_type: ['single_family'],
          ownership_status: 'owner'
        }
      }

      const response = await fetch('/api/list-builder/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ criteria })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.estimatedCount).toBeGreaterThan(0)
      expect(result.estimatedCost).toBeGreaterThan(0)
      expect(result.isValid).toBe(true)
    })

    it('should validate criteria properly', async () => {
      const invalidCriteria = {
        demographic: {},
        geographic: {}, // No geographic filters
        property: {}
      }

      const response = await fetch('/api/list-builder/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ criteria: invalidCriteria })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Analytics API', () => {
    it('should create short links', async () => {
      const response = await fetch('/api/analytics/short-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          originalUrl: 'https://example.com',
          options: {
            campaignId: uuidv4(),
            customAlias: 'test-link'
          }
        })
      })

      expect(response.ok).toBe(true)
      const shortLink = await response.json()
      expect(shortLink.short_url).toContain('/s/')
      expect(shortLink.original_url).toBe('https://example.com')
    })

    it('should get performance metrics', async () => {
      const response = await fetch('/api/analytics/performance', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.ok).toBe(true)
      const metrics = await response.json()
      expect(metrics).toHaveProperty('totalCampaigns')
      expect(metrics).toHaveProperty('totalShortLinks')
      expect(metrics).toHaveProperty('totalClicks')
      expect(metrics).toHaveProperty('averageCTR')
    })
  })

  describe('Team API', () => {
    it('should create teams', async () => {
      const response = await fetch('/api/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Test Team',
          description: 'API Test Team',
          plan: 'team'
        })
      })

      expect(response.ok).toBe(true)
      const team = await response.json()
      expect(team.name).toBe('Test Team')
      expect(team.owner_id).toBe(testUser.id)
    })

    it('should invite team members', async () => {
      // First create a team
      const teamResponse = await fetch('/api/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Invitation Test Team',
          plan: 'team'
        })
      })

      const team = await teamResponse.json()

      // Then invite a member
      const inviteResponse = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          teamId: team.id,
          email: 'invited@example.com',
          role: 'member'
        })
      })

      expect(inviteResponse.ok).toBe(true)
      const invitation = await inviteResponse.json()
      expect(invitation.email).toBe('invited@example.com')
      expect(invitation.team_id).toBe(team.id)
    })
  })

  describe('Vendor API', () => {
    it('should create vendors', async () => {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Test Vendor',
          type: 'print',
          contact_info: {
            email: 'vendor@example.com',
            phone: '555-0123'
          },
          services: ['printing', 'fulfillment']
        })
      })

      expect(response.ok).toBe(true)
      const vendor = await response.json()
      expect(vendor.name).toBe('Test Vendor')
      expect(vendor.type).toBe('print')
      expect(vendor.user_id).toBe(testUser.id)
    })

    it('should get vendor performance', async () => {
      // Create vendor first
      const vendorResponse = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Performance Test Vendor',
          type: 'print',
          contact_info: { email: 'perf@example.com' },
          services: ['printing']
        })
      })

      const vendor = await vendorResponse.json()

      // Get performance
      const perfResponse = await fetch(`/api/vendors/${vendor.id}/performance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(perfResponse.ok).toBe(true)
      const performance = await perfResponse.json()
      expect(performance).toHaveProperty('totalOrders')
      expect(performance).toHaveProperty('completedOrders')
      expect(performance).toHaveProperty('averageCompletionTime')
    })
  })

  describe('Enhanced Campaign API', () => {
    it('should create campaigns with split configuration', async () => {
      // Create contact card first
      const { data: contactCard } = await supabase
        .from('contact_cards')
        .insert({
          id: uuidv4(),
          user_id: testUser.id,
          name: 'Test Contact Card',
          return_address: '123 Test St'
        })
        .select()
        .single()

      // Create mailing list
      const { data: mailingList } = await supabase
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: testUser.id,
          name: 'Test List',
          source: 'manual'
        })
        .select()
        .single()

      const response = await fetch('/api/campaigns/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Split Campaign Test',
          contactCardId: contactCard.id,
          mailingListIds: [mailingList.id],
          splitConfig: {
            enabled: true,
            splitCount: 3,
            interval: 'weeks',
            intervalCount: 1,
            startDate: new Date().toISOString()
          }
        })
      })

      expect(response.ok).toBe(true)
      const campaign = await response.json()
      expect(campaign.name).toBe('Split Campaign Test')
      expect(campaign.split_config.enabled).toBe(true)
    })
  })

  describe('Asset API', () => {
    it('should upload assets', async () => {
      // Create a test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('name', 'Test Asset')
      formData.append('category', 'document')

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      expect(response.ok).toBe(true)
      const asset = await response.json()
      expect(asset.name).toBe('Test Asset')
      expect(asset.category).toBe('document')
      expect(asset.user_id).toBe(testUser.id)
    })

    it('should get asset statistics', async () => {
      const response = await fetch('/api/assets/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.ok).toBe(true)
      const stats = await response.json()
      expect(stats).toHaveProperty('totalAssets')
      expect(stats).toHaveProperty('storageUsed')
      expect(stats).toHaveProperty('storageLimit')
      expect(stats).toHaveProperty('assetsByCategory')
    })
  })

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No authorization header
        },
        body: JSON.stringify({
          name: 'Unauthorized Vendor',
          type: 'print'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should validate required fields', async () => {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          // Missing required name and type
          contact_info: { email: 'test@example.com' }
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toContain('required')
    })
  })
})
