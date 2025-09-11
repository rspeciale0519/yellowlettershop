import { describe, it } from 'mocha'
import { expect } from 'chai'
import http from 'http'

describe('HTTP Direct Test', () => {
  it('should connect directly via HTTP', (done) => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const options = {
      hostname: '127.0.0.1',
      port: 54321,
      path: '/rest/v1/user_profiles?limit=0',
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('Response status:', res.statusCode)
        console.log('Response data:', data)
        
        expect(res.statusCode).to.equal(200)
        const parsedData = JSON.parse(data)
        expect(parsedData).to.be.an('array')
        
        done()
      })
    })

    req.on('error', (err) => {
      console.error('Request error:', err)
      done(err)
    })

    req.on('timeout', () => {
      console.error('Request timeout')
      req.destroy()
      done(new Error('Request timeout'))
    })

    req.end()
  })
})