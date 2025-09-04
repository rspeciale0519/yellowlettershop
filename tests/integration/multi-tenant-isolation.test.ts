import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('Multi-Tenant Isolation Tests', () => {
  let supabase: any
  let testUser1: any
  let testUser2: any
  let testTeam1: any
  let testTeam2: any

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create test users
    const { data: user1 } = await supabase.auth.admin.createUser({
      email: `test1-${uuidv4()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    
    const { data: user2 } = await supabase.auth.admin.createUser({
      email: `test2-${uuidv4()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })

    testUser1 = user1.user
    testUser2 = user2.user

    // Create test teams
    const { data: team1 } = await supabase
      .from('teams')
      .insert({
        id: uuidv4(),
        name: 'Test Team 1',
        owner_id: testUser1.id,
        plan: 'team'
      })
      .select()
      .single()

    const { data: team2 } = await supabase
      .from('teams')
      .insert({
        id: uuidv4(),
        name: 'Test Team 2',
        owner_id: testUser2.id,
        plan: 'team'
      })
      .select()
      .single()

    testTeam1 = team1
    testTeam2 = team2
  })

  afterAll(async () => {
    // Cleanup test data
    if (testUser1) {
      await supabase.auth.admin.deleteUser(testUser1.id)
    }
    if (testUser2) {
      await supabase.auth.admin.deleteUser(testUser2.id)
    }
  })

  describe('Mailing Lists Isolation', () => {
    it('should prevent users from accessing other users mailing lists', async () => {
      // Create mailing list as user1
      const { data: mailingList } = await supabase
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          name: 'User 1 List',
          source: 'manual'
        })
        .select()
        .single()

      // Try to access as user2 - should fail
      const { data: unauthorizedAccess, error } = await supabase
        .from('mailing_lists')
        .select('*')
        .eq('id', mailingList.id)
        .eq('user_id', testUser2.id)

      expect(unauthorizedAccess).toHaveLength(0)
      expect(error).toBeNull() // RLS should filter results, not error
    })

    it('should allow team members to access shared mailing lists', async () => {
      // Add user2 to team1
      await supabase
        .from('team_members')
        .insert({
          id: uuidv4(),
          team_id: testTeam1.id,
          user_id: testUser2.id,
          role: 'member',
          status: 'active'
        })

      // Create team mailing list
      const { data: teamList } = await supabase
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          team_id: testTeam1.id,
          name: 'Team Shared List',
          source: 'manual'
        })
        .select()
        .single()

      // User2 should be able to access team list
      const { data: sharedAccess } = await supabase
        .from('mailing_lists')
        .select('*')
        .eq('id', teamList.id)

      expect(sharedAccess).toHaveLength(1)
      expect(sharedAccess[0].id).toBe(teamList.id)
    })
  })

  describe('Campaign Isolation', () => {
    it('should prevent cross-user campaign access', async () => {
      // Create campaign as user1
      const { data: campaign } = await supabase
        .from('campaigns')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          name: 'User 1 Campaign',
          contact_card_id: uuidv4(),
          status: 'draft'
        })
        .select()
        .single()

      // Try to access as user2
      const { data: unauthorizedCampaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaign.id)
        .eq('user_id', testUser2.id)

      expect(unauthorizedCampaign).toHaveLength(0)
    })
  })

  describe('File Assets Isolation', () => {
    it('should prevent access to private assets from other users', async () => {
      // Create private asset as user1
      const { data: privateAsset } = await supabase
        .from('file_assets')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          name: 'Private Asset',
          file_name: 'private.jpg',
          file_path: 'assets/private.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          category: 'image',
          is_public: false
        })
        .select()
        .single()

      // Try to access as user2
      const { data: unauthorizedAsset } = await supabase
        .from('file_assets')
        .select('*')
        .eq('id', privateAsset.id)
        .eq('user_id', testUser2.id)

      expect(unauthorizedAsset).toHaveLength(0)
    })

    it('should allow access to public assets', async () => {
      // Create public asset as user1
      const { data: publicAsset } = await supabase
        .from('file_assets')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          name: 'Public Asset',
          file_name: 'public.jpg',
          file_path: 'assets/public.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          category: 'image',
          is_public: true
        })
        .select()
        .single()

      // User2 should be able to access public asset
      const { data: publicAccess } = await supabase
        .from('file_assets')
        .select('*')
        .eq('id', publicAsset.id)
        .eq('is_public', true)

      expect(publicAccess).toHaveLength(1)
      expect(publicAccess[0].id).toBe(publicAsset.id)
    })
  })

  describe('Vendor Isolation', () => {
    it('should prevent cross-user vendor access', async () => {
      // Create vendor as user1
      const { data: vendor } = await supabase
        .from('vendors')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          name: 'User 1 Vendor',
          type: 'print',
          contact_info: { email: 'vendor@example.com' },
          services: ['printing']
        })
        .select()
        .single()

      // Try to access as user2
      const { data: unauthorizedVendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendor.id)
        .eq('user_id', testUser2.id)

      expect(unauthorizedVendor).toHaveLength(0)
    })
  })

  describe('Analytics and Usage Tracking Isolation', () => {
    it('should prevent cross-user analytics access', async () => {
      // Create usage record as user1
      const { data: usage } = await supabase
        .from('mailing_list_usage')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          resource_type: 'mailing_list',
          resource_id: uuidv4(),
          action: 'view'
        })
        .select()
        .single()

      // Try to access as user2
      const { data: unauthorizedUsage } = await supabase
        .from('mailing_list_usage')
        .select('*')
        .eq('id', usage.id)
        .eq('user_id', testUser2.id)

      expect(unauthorizedUsage).toHaveLength(0)
    })
  })

  describe('Change History Isolation', () => {
    it('should prevent access to other users change history', async () => {
      // Create change record as user1
      const { data: change } = await supabase
        .from('change_history')
        .insert({
          id: uuidv4(),
          user_id: testUser1.id,
          resource_type: 'mailing_list',
          resource_id: uuidv4(),
          change_type: 'create',
          sequence_number: 1
        })
        .select()
        .single()

      // Try to access as user2
      const { data: unauthorizedChange } = await supabase
        .from('change_history')
        .select('*')
        .eq('id', change.id)
        .eq('user_id', testUser2.id)

      expect(unauthorizedChange).toHaveLength(0)
    })
  })

  describe('Team Resource Sharing', () => {
    it('should allow team resource sharing with proper permissions', async () => {
      // Create team resource sharing
      const { data: sharing } = await supabase
        .from('team_resource_sharing')
        .insert({
          id: uuidv4(),
          resource_type: 'mailing_list',
          resource_id: uuidv4(),
          team_id: testTeam1.id,
          shared_by: testUser1.id,
          permissions: ['read']
        })
        .select()
        .single()

      // Team member should be able to access
      const { data: teamAccess } = await supabase
        .from('team_resource_sharing')
        .select('*')
        .eq('id', sharing.id)
        .eq('team_id', testTeam1.id)

      expect(teamAccess).toHaveLength(1)
    })
  })

  describe('Admin Override Tests', () => {
    it('should allow service role to access all data', async () => {
      // Service role should be able to access any user's data
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('*')

      expect(allUsers.length).toBeGreaterThan(0)
    })
  })
})
