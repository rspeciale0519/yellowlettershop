import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local before anything else
config({ path: path.resolve(process.cwd(), '.env.local') })

// Verify critical environment variables are loaded
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables for tests:')
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`)
  })
  console.error('\nMake sure .env.local file exists with all required variables.')
  process.exit(1)
}

console.log('✅ Test environment variables loaded successfully')
console.log(`   - SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log(`   - Service role key loaded: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`)
console.log(`   - Anon key loaded: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)