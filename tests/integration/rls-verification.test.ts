import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

describe('Row Level Security (RLS) Verification', () => {
  let adminClient: any
  let anonClient: any
  let testUser: any

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, supabaseServiceKey)
    anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // Create test user
    const { data: user } = await adminClient.auth.admin.createUser({
      email: `rls-test-${uuidv4()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    testUser = user.user
  })

  afterAll(async () => {
    if (testUser) {
      await adminClient.auth.admin.deleteUser(testUser.id)
    }
  })

  describe('Anonymous Access Restrictions', () => {
    it('should prevent anonymous access to user_profiles', async () => {
      const { data, error } = await anonClient
        .from('user_profiles')
        .select('*')

      expect(data).toBeNull()
      expect(error).toBeTruthy()
      expect(error.code).toBe('42501') // Insufficient privilege
    })

    it('should prevent anonymous access to mailing_lists', async () => {
      const { data, error } = await anonClient
        .from('mailing_lists')
        .select('*')

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })

    it('should prevent anonymous access to campaigns', async () => {
      const { data, error } = await anonClient
        .from('campaigns')
        .select('*')

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })

    it('should prevent anonymous access to change_history', async () => {
      const { data, error } = await anonClient
        .from('change_history')
        .select('*')

      expect(data).toBeNull()
      expect(error).toBeTruthy()
    })
  })

  describe('Authenticated User Access', () => {
    let authenticatedClient: any

    beforeAll(async () => {
      authenticatedClient = createClient(supabaseUrl, supabaseAnonKey)
      await authenticatedClient.auth.signInWithPassword({
        email: testUser.email,
        password: 'testpassword123'
      })
    })

    it('should allow authenticated users to access their own user_profiles', async () => {
      const { data, error } = await authenticatedClient
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should prevent authenticated users from accessing other users profiles', async () => {
      // Create another user
      const { data: otherUser } = await adminClient.auth.admin.createUser({
        email: `other-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })

      const { data, error } = await authenticatedClient
        .from('user_profiles')
        .select('*')
        .eq('id', otherUser.user.id)

      expect(data).toHaveLength(0) // RLS should filter out results
      expect(error).toBeNull()

      // Cleanup
      await adminClient.auth.admin.deleteUser(otherUser.user.id)
    })

    it('should allow users to create their own mailing lists', async () => {
      const { data, error } = await authenticatedClient
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: testUser.id,
          name: 'Test List',
          source: 'manual'
        })
        .select()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data[0].user_id).toBe(testUser.id)
    })

    it('should prevent users from creating mailing lists for other users', async () => {
      const { data: otherUser } = await adminClient.auth.admin.createUser({
        email: `other2-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })

      const { data, error } = await authenticatedClient
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: otherUser.user.id, // Try to create for another user
          name: 'Unauthorized List',
          source: 'manual'
        })
        .select()

      expect(data).toBeNull()
      expect(error).toBeTruthy()

      // Cleanup
      await adminClient.auth.admin.deleteUser(otherUser.user.id)
    })
  })

  describe('Team-based Access Control', () => {
    let teamOwner: any
    let teamMember: any
    let team: any
    let ownerClient: any
    let memberClient: any

    beforeAll(async () => {
      // Create team owner
      const { data: owner } = await adminClient.auth.admin.createUser({
        email: `owner-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })
      teamOwner = owner.user

      // Create team member
      const { data: member } = await adminClient.auth.admin.createUser({
        email: `member-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })
      teamMember = member.user

      // Create team
      const { data: teamData } = await adminClient
        .from('teams')
        .insert({
          id: uuidv4(),
          name: 'RLS Test Team',
          owner_id: teamOwner.id,
          plan: 'team'
        })
        .select()
        .single()
      team = teamData

      // Add member to team
      await adminClient
        .from('team_members')
        .insert({
          id: uuidv4(),
          team_id: team.id,
          user_id: teamMember.id,
          role: 'member',
          status: 'active'
        })

      // Create authenticated clients
      ownerClient = createClient(supabaseUrl, supabaseAnonKey)
      await ownerClient.auth.signInWithPassword({
        email: teamOwner.email,
        password: 'testpassword123'
      })

      memberClient = createClient(supabaseUrl, supabaseAnonKey)
      await memberClient.auth.signInWithPassword({
        email: teamMember.email,
        password: 'testpassword123'
      })
    })

    afterAll(async () => {
      if (teamOwner) await adminClient.auth.admin.deleteUser(teamOwner.id)
      if (teamMember) await adminClient.auth.admin.deleteUser(teamMember.id)
    })

    it('should allow team members to access team resources', async () => {
      // Owner creates team mailing list
      const { data: teamList } = await ownerClient
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: teamOwner.id,
          team_id: team.id,
          name: 'Team List',
          source: 'manual'
        })
        .select()
        .single()

      // Member should be able to access team list
      const { data: memberAccess, error } = await memberClient
        .from('mailing_lists')
        .select('*')
        .eq('id', teamList.id)

      expect(error).toBeNull()
      expect(memberAccess).toHaveLength(1)
      expect(memberAccess[0].team_id).toBe(team.id)
    })

    it('should prevent non-team members from accessing team resources', async () => {
      // Create non-team member
      const { data: outsider } = await adminClient.auth.admin.createUser({
        email: `outsider-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })

      const outsiderClient = createClient(supabaseUrl, supabaseAnonKey)
      await outsiderClient.auth.signInWithPassword({
        email: outsider.user.email,
        password: 'testpassword123'
      })

      // Create team resource
      const { data: teamResource } = await ownerClient
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: teamOwner.id,
          team_id: team.id,
          name: 'Private Team List',
          source: 'manual'
        })
        .select()
        .single()

      // Outsider should not be able to access
      const { data: outsiderAccess } = await outsiderClient
        .from('mailing_lists')
        .select('*')
        .eq('id', teamResource.id)

      expect(outsiderAccess).toHaveLength(0)

      // Cleanup
      await adminClient.auth.admin.deleteUser(outsider.user.id)
    })
  })

  describe('Public Resource Access', () => {
    let resourceOwner: any
    let publicViewer: any
    let ownerClient: any
    let viewerClient: any

    beforeAll(async () => {
      // Create resource owner
      const { data: owner } = await adminClient.auth.admin.createUser({
        email: `public-owner-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })
      resourceOwner = owner.user

      // Create public viewer
      const { data: viewer } = await adminClient.auth.admin.createUser({
        email: `public-viewer-${uuidv4()}@example.com`,
        password: 'testpassword123',
        email_confirm: true
      })
      publicViewer = viewer.user

      // Create authenticated clients
      ownerClient = createClient(supabaseUrl, supabaseAnonKey)
      await ownerClient.auth.signInWithPassword({
        email: resourceOwner.email,
        password: 'testpassword123'
      })

      viewerClient = createClient(supabaseUrl, supabaseAnonKey)
      await viewerClient.auth.signInWithPassword({
        email: publicViewer.email,
        password: 'testpassword123'
      })
    })

    afterAll(async () => {
      if (resourceOwner) await adminClient.auth.admin.deleteUser(resourceOwner.id)
      if (publicViewer) await adminClient.auth.admin.deleteUser(publicViewer.id)
    })

    it('should allow access to public file assets', async () => {
      // Owner creates public asset
      const { data: publicAsset } = await ownerClient
        .from('file_assets')
        .insert({
          id: uuidv4(),
          user_id: resourceOwner.id,
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

      // Viewer should be able to access public asset
      const { data: viewerAccess, error } = await viewerClient
        .from('file_assets')
        .select('*')
        .eq('id', publicAsset.id)
        .eq('is_public', true)

      expect(error).toBeNull()
      expect(viewerAccess).toHaveLength(1)
      expect(viewerAccess[0].is_public).toBe(true)
    })

    it('should prevent access to private file assets', async () => {
      // Owner creates private asset
      const { data: privateAsset } = await ownerClient
        .from('file_assets')
        .insert({
          id: uuidv4(),
          user_id: resourceOwner.id,
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

      // Viewer should not be able to access private asset
      const { data: viewerAccess } = await viewerClient
        .from('file_assets')
        .select('*')
        .eq('id', privateAsset.id)

      expect(viewerAccess).toHaveLength(0)
    })
  })

  describe('Admin Override Verification', () => {
    it('should allow service role to bypass RLS', async () => {
      // Service role should be able to access all data regardless of RLS
      const { data: allProfiles, error } = await adminClient
        .from('user_profiles')
        .select('*')

      expect(error).toBeNull()
      expect(allProfiles).toBeTruthy()
    })

    it('should allow service role to modify any data', async () => {
      // Create data as service role for any user
      const { data: adminCreated, error } = await adminClient
        .from('mailing_lists')
        .insert({
          id: uuidv4(),
          user_id: testUser.id,
          name: 'Admin Created List',
          source: 'manual'
        })
        .select()

      expect(error).toBeNull()
      expect(adminCreated).toBeTruthy()
      expect(adminCreated[0].user_id).toBe(testUser.id)
    })
  })
})
