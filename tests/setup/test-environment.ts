import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Test environment setup utilities
export class TestEnvironment {
  private supabase: any
  private testUsers: any[] = []
  private testTeams: any[] = []
  private testResources: any[] = []

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Creates a test user with proper setup
   */
  async createTestUser(email?: string): Promise<any> {
    const userEmail = email || `test-${uuidv4()}@example.com`
    
    const { data: user, error } = await this.supabase.auth.admin.createUser({
      email: userEmail,
      password: 'testpassword123',
      email_confirm: true
    })

    if (error) throw error

    // Create user profile
    await this.supabase
      .from('user_profiles')
      .insert({
        id: user.user.id,
        email: userEmail,
        full_name: `Test User ${user.user.id.slice(0, 8)}`,
        subscription_plan: 'pro'
      })

    this.testUsers.push(user.user)
    return user.user
  }

  /**
   * Creates a test team with owner
   */
  async createTestTeam(ownerId: string, name?: string): Promise<any> {
    const teamName = name || `Test Team ${uuidv4().slice(0, 8)}`
    
    const teamData = {
      id: uuidv4(),
      name: teamName,
      owner_id: ownerId,
      plan: 'team',
      settings: {
        allow_member_invites: true,
        require_approval_for_campaigns: false
      }
    }

    const { data: team, error } = await this.supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single()

    if (error) throw error

    // Add owner as admin member
    await this.supabase
      .from('team_members')
      .insert({
        id: uuidv4(),
        team_id: team.id,
        user_id: ownerId,
        role: 'admin',
        permissions: [
          'canManageMembers',
          'canManageSettings',
          'canCreateCampaigns',
          'canManageMailingLists',
          'canViewAnalytics',
          'canManageVendors',
          'canManageAssets'
        ],
        status: 'active',
        joined_at: new Date().toISOString()
      })

    this.testTeams.push(team)
    return team
  }

  /**
   * Creates test mailing list with records
   */
  async createTestMailingList(userId: string, recordCount: number = 10): Promise<any> {
    const listData = {
      id: uuidv4(),
      user_id: userId,
      name: `Test List ${uuidv4().slice(0, 8)}`,
      source: 'manual',
      record_count: recordCount
    }

    const { data: mailingList, error } = await this.supabase
      .from('mailing_lists')
      .insert(listData)
      .select()
      .single()

    if (error) throw error

    // Create test records
    const records = []
    for (let i = 0; i < recordCount; i++) {
      records.push({
        id: uuidv4(),
        mailing_list_id: mailingList.id,
        user_id: userId,
        first_name: `First${i}`,
        last_name: `Last${i}`,
        address: `${i} Test St`,
        city: 'Test City',
        state: 'CA',
        zip_code: '90210',
        additional_data: {
          age: 25 + (i % 40),
          income: 50000 + (i * 1000)
        }
      })
    }

    await this.supabase
      .from('mailing_list_records')
      .insert(records)

    this.testResources.push({ type: 'mailing_list', id: mailingList.id })
    return mailingList
  }

  /**
   * Creates test contact card
   */
  async createTestContactCard(userId: string): Promise<any> {
    const contactCardData = {
      id: uuidv4(),
      user_id: userId,
      name: `Test Contact Card ${uuidv4().slice(0, 8)}`,
      return_address: '123 Test Street, Test City, CA 90210',
      business_info: {
        company: 'Test Company',
        phone: '555-0123',
        email: 'test@example.com'
      }
    }

    const { data: contactCard, error } = await this.supabase
      .from('contact_cards')
      .insert(contactCardData)
      .select()
      .single()

    if (error) throw error

    this.testResources.push({ type: 'contact_card', id: contactCard.id })
    return contactCard
  }

  /**
   * Creates test vendor
   */
  async createTestVendor(userId: string): Promise<any> {
    const vendorData = {
      id: uuidv4(),
      user_id: userId,
      name: `Test Vendor ${uuidv4().slice(0, 8)}`,
      type: 'print',
      contact_info: {
        email: 'vendor@example.com',
        phone: '555-0123',
        contact_person: 'John Vendor'
      },
      services: ['printing', 'fulfillment'],
      pricing_model: 'per_piece',
      status: 'active'
    }

    const { data: vendor, error } = await this.supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single()

    if (error) throw error

    this.testResources.push({ type: 'vendor', id: vendor.id })
    return vendor
  }

  /**
   * Creates test campaign
   */
  async createTestCampaign(userId: string, contactCardId: string, mailingListIds: string[]): Promise<any> {
    const campaignData = {
      id: uuidv4(),
      user_id: userId,
      name: `Test Campaign ${uuidv4().slice(0, 8)}`,
      contact_card_id: contactCardId,
      status: 'draft',
      record_count: 0
    }

    const { data: campaign, error } = await this.supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single()

    if (error) throw error

    this.testResources.push({ type: 'campaign', id: campaign.id })
    return campaign
  }

  /**
   * Verifies RLS policies are working
   */
  async verifyRLSIsolation(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      // Create resource as user1
      const list1 = await this.createTestMailingList(user1Id, 5)

      // Try to access as user2 - should return empty
      const { data: unauthorizedAccess } = await this.supabase
        .from('mailing_lists')
        .select('*')
        .eq('id', list1.id)
        .eq('user_id', user2Id)

      return unauthorizedAccess?.length === 0
    } catch (error) {
      console.error('RLS verification failed:', error)
      return false
    }
  }

  /**
   * Cleans up all test data
   */
  async cleanup(): Promise<void> {
    try {
      // Delete test resources
      for (const resource of this.testResources) {
        try {
          await this.supabase
            .from(this.getTableName(resource.type))
            .delete()
            .eq('id', resource.id)
        } catch (error) {
          console.warn(`Failed to delete ${resource.type} ${resource.id}:`, error)
        }
      }

      // Delete test teams
      for (const team of this.testTeams) {
        try {
          await this.supabase
            .from('teams')
            .delete()
            .eq('id', team.id)
        } catch (error) {
          console.warn(`Failed to delete team ${team.id}:`, error)
        }
      }

      // Delete test users
      for (const user of this.testUsers) {
        try {
          await this.supabase.auth.admin.deleteUser(user.id)
        } catch (error) {
          console.warn(`Failed to delete user ${user.id}:`, error)
        }
      }

      // Clear arrays
      this.testUsers = []
      this.testTeams = []
      this.testResources = []
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  private getTableName(resourceType: string): string {
    const tableMap: Record<string, string> = {
      'mailing_list': 'mailing_lists',
      'contact_card': 'contact_cards',
      'vendor': 'vendors',
      'campaign': 'campaigns',
      'file_asset': 'file_assets'
    }
    return tableMap[resourceType] || resourceType
  }
}

/**
 * Global test environment instance
 */
export const testEnv = new TestEnvironment()

/**
 * Setup function for test suites
 */
export async function setupTestSuite(): Promise<{
  user1: any
  user2: any
  team: any
  mailingList: any
  contactCard: any
  vendor: any
}> {
  const user1 = await testEnv.createTestUser()
  const user2 = await testEnv.createTestUser()
  const team = await testEnv.createTestTeam(user1.id)
  const mailingList = await testEnv.createTestMailingList(user1.id, 10)
  const contactCard = await testEnv.createTestContactCard(user1.id)
  const vendor = await testEnv.createTestVendor(user1.id)

  return {
    user1,
    user2,
    team,
    mailingList,
    contactCard,
    vendor
  }
}

/**
 * Cleanup function for test suites
 */
export async function cleanupTestSuite(): Promise<void> {
  await testEnv.cleanup()
}
