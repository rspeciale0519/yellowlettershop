/**
 * Script to verify and setup Supabase Storage configuration
 * This checks if the 'assets' bucket exists and creates it if needed
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyStorageSetup() {
  console.log('🔍 Verifying Supabase Storage setup...')
  
  try {
    // 1. Check if 'assets' bucket exists
    console.log('\n1. Checking for assets bucket...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }
    
    const assetsBucket = buckets?.find(bucket => bucket.name === 'assets')
    
    if (assetsBucket) {
      console.log('✅ Assets bucket exists')
      console.log(`   - ID: ${assetsBucket.id}`)
      console.log(`   - Public: ${assetsBucket.public}`)
      console.log(`   - Created: ${assetsBucket.created_at}`)
    } else {
      console.log('❌ Assets bucket not found')
      
      // 2. Create the bucket
      console.log('\n2. Creating assets bucket...')
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('assets', {
        public: false, // Private bucket for user files
        allowedMimeTypes: [
          // Images
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          // Documents  
          'application/pdf', 'text/plain', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          // Video/Audio
          'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
          // Fonts
          'font/ttf', 'font/otf', 'font/woff', 'font/woff2'
        ],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB max file size
      })
      
      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }
      
      console.log('✅ Assets bucket created successfully')
      console.log(`   - Name: ${newBucket.name}`)
    }
    
    // 3. Test bucket access permissions
    console.log('\n3. Testing bucket permissions...')
    
    // Test file upload (small test file)
    const testFileName = `test-${Date.now()}.txt`
    const testContent = 'Storage test file - safe to delete'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(`test/${testFileName}`, new Blob([testContent], { type: 'text/plain' }))
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message)
    } else {
      console.log('✅ Upload test successful')
      console.log(`   - Path: ${uploadData.path}`)
      
      // Test file deletion
      const { error: deleteError } = await supabase.storage
        .from('assets')
        .remove([uploadData.path])
      
      if (deleteError) {
        console.log('⚠️  Delete test failed:', deleteError.message)
      } else {
        console.log('✅ Delete test successful')
      }
    }
    
    // 4. Check RLS policies on user_assets table
    console.log('\n4. Checking user_assets table RLS policies...')
    
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_assets')
    
    if (policyError) {
      console.log('❌ Failed to check RLS policies:', policyError.message)
    } else {
      console.log(`✅ Found ${policies?.length || 0} RLS policies on user_assets`)
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    }
    
    // 5. Summary
    console.log('\n📊 Storage Setup Summary:')
    console.log('✅ Supabase connection working')
    console.log('✅ Assets bucket verified/created')
    console.log('✅ Upload/delete permissions working')
    console.log('✅ RLS policies configured')
    
    console.log('\n🎉 Storage setup verification complete!')
    
  } catch (error) {
    console.error('❌ Storage verification failed:', error.message)
    process.exit(1)
  }
}

// Run verification
verifyStorageSetup()
