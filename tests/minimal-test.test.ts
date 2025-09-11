import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createClient } from '@supabase/supabase-js'

describe('Minimal Environment Test', () => {
  it('should connect to Supabase and query tables', async function() {
    this.timeout(5000)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const client = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test basic table access with service role
    const { data, error } = await client
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    console.log('Query result:', { data, error })
    
    expect(error).to.be.null
    expect(data).to.be.an('array')
  })

  it('should verify RLS blocks anonymous access', async function() {
    this.timeout(5000)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test that anonymous access is blocked
    const { data, error } = await anonClient
      .from('user_profiles')
      .select('*')

    console.log('Anonymous query result:', { data, error })
    
    // Should either have error or empty data due to RLS
    expect(data).to.be.null
    expect(error).to.exist
  })
})