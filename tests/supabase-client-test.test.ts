import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createClient } from '@supabase/supabase-js'

describe('Supabase Client Test', () => {
  it('should work with explicit timeout handling', async function() {
    this.timeout(5000)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options = {}) => {
          // Add timeout to fetch
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 3000)
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => clearTimeout(id))
        }
      }
    })
    
    console.log('Client created, making request...')
    
    try {
      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .limit(0)

      console.log('Request completed:', { data, error })
      
      expect(error).to.be.null
      expect(data).to.be.an('array')
      
    } catch (err) {
      console.error('Request failed:', err)
      throw err
    }
  })
  
  it('should handle anonymous access rejection', async function() {
    this.timeout(5000)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options = {}) => {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 3000)
          
          return fetch(url, {
            ...options,
            signal: controller.signal
          }).finally(() => clearTimeout(id))
        }
      }
    })
    
    console.log('Making anonymous request...')
    
    try {
      const { data, error } = await anonClient
        .from('user_profiles')
        .select('*')

      console.log('Anonymous request result:', { data, error })
      
      // Should be blocked by RLS - returns empty array, not null
      expect(data).to.be.an('array')
      expect(data).to.have.length(0)
      expect(error).to.be.null
      
    } catch (err) {
      console.error('Anonymous request failed:', err)
      throw err
    }
  })
})