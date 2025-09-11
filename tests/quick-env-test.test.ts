import { describe, it, before, after } from 'mocha'
import { expect } from 'chai'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

describe('Quick Environment Test', () => {
  let adminClient: any
  let testUser: any

  before(async function() {
    this.timeout(30000) // Increase timeout for setup
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create a test user to verify auth admin works
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: `quick-test-${uuidv4()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (userError) {
      console.error('User creation error:', userError)
      throw new Error(`Failed to create test user: ${userError.message}`)
    }
    
    testUser = userData?.user
    console.log('Created test user:', testUser?.id)
  })

  after(async function() {
    this.timeout(30000)
    if (testUser && adminClient) {
      try {
        await adminClient.auth.admin.deleteUser(testUser.id)
        console.log('Cleaned up test user:', testUser.id)
      } catch (error) {
        console.warn('Failed to cleanup test user:', error)
      }
    }
  })

  it('should have working Supabase environment', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).to.exist
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).to.exist
    expect(adminClient).to.exist
  })

  it('should create and verify test user', () => {
    expect(testUser).to.exist
    expect(testUser.id).to.exist
    expect(testUser.email).to.include('quick-test-')
  })

  it('should access user_profiles table with service role', async function() {
    this.timeout(10000)
    
    const { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .limit(1)

    expect(error).to.be.null
    expect(data).to.be.an('array')
  })
})