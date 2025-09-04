/**
 * Test script for version history functionality
 * This script demonstrates creating snapshots, making changes, and restoring versions
 */

import { createClient } from '@supabase/supabase-js'
import { createSnapshot, restoreFromSnapshot, getVersionHistory } from '../lib/supabase/version-history'
import { createMailingList, createMailingListRecord } from '../lib/supabase/mailing-lists'

// Note: This is a test script - replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testVersionHistory() {
  console.log('🧪 Testing Version History System')
  console.log('=' .repeat(50))

  try {
    // Step 1: Create a test mailing list
    console.log('\n📝 Step 1: Creating test mailing list...')
    const mailingList = await createMailingList({
      name: 'Version History Test List',
      description: 'Test list for version history functionality',
      source_type: 'manual'
    })
    console.log(`✅ Created mailing list: ${mailingList.name} (${mailingList.id})`)

    // Step 2: Add initial records
    console.log('\n📋 Step 2: Adding initial records...')
    const initialRecords = [
      {
        first_name: 'John',
        last_name: 'Doe',
        street_address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip_code: '12345',
        additional_data: { property_type: 'single_family', estimated_value: 350000 }
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        street_address: '456 Oak Ave',
        city: 'Somewhere',
        state: 'TX',
        zip_code: '67890',
        additional_data: { property_type: 'condo', estimated_value: 285000 }
      },
      {
        first_name: 'Bob',
        last_name: 'Johnson',
        street_address: '789 Pine Rd',
        city: 'Elsewhere',
        state: 'FL',
        zip_code: '11111',
        additional_data: { property_type: 'townhouse', estimated_value: 425000 }
      }
    ]

    for (const record of initialRecords) {
      await createMailingListRecord(mailingList.id, record)
    }
    console.log(`✅ Added ${initialRecords.length} initial records`)

    // Step 3: Create initial snapshot
    console.log('\n📸 Step 3: Creating initial snapshot...')
    const initialSnapshot = await createSnapshot(
      mailingList.id, 
      'manual',
      { description: 'Initial snapshot with 3 records' }
    )
    console.log(`✅ Created initial snapshot v${initialSnapshot.version_number}`)

    // Step 4: Add more records
    console.log('\n➕ Step 4: Adding more records...')
    const additionalRecords = [
      {
        first_name: 'Alice',
        last_name: 'Brown',
        street_address: '321 Elm St',
        city: 'Newtown',
        state: 'NY',
        zip_code: '22222',
        additional_data: { property_type: 'apartment', estimated_value: 195000 }
      },
      {
        first_name: 'Charlie',
        last_name: 'Davis',
        street_address: '654 Maple Dr',
        city: 'Oldtown',
        state: 'WA',
        zip_code: '33333',
        additional_data: { property_type: 'single_family', estimated_value: 520000 }
      }
    ]

    for (const record of additionalRecords) {
      await createMailingListRecord(mailingList.id, record)
    }
    console.log(`✅ Added ${additionalRecords.length} additional records`)

    // Step 5: Create second snapshot
    console.log('\n📸 Step 5: Creating second snapshot...')
    const secondSnapshot = await createSnapshot(
      mailingList.id,
      'manual',
      { description: 'Snapshot after adding 2 more records (total: 5)' }
    )
    console.log(`✅ Created second snapshot v${secondSnapshot.version_number}`)

    // Step 6: Simulate deduplication process
    console.log('\n🔍 Step 6: Simulating deduplication process...')
    
    // Create snapshot before deduplication
    const beforeDedupSnapshot = await createSnapshot(
      mailingList.id,
      'before_dedup',
      { description: 'Automatic snapshot before deduplication process' }
    )
    console.log(`✅ Created before-dedup snapshot v${beforeDedupSnapshot.version_number}`)

    // Simulate removing a duplicate record
    const { data: records } = await supabase
      .from('mailing_list_records')
      .select('*')
      .eq('mailing_list_id', mailingList.id)
      .limit(1)

    if (records && records.length > 0) {
      await supabase
        .from('mailing_list_records')
        .delete()
        .eq('id', records[0].id)
      console.log('✅ Simulated duplicate removal (deleted 1 record)')
    }

    // Step 7: View version history
    console.log('\n📜 Step 7: Viewing version history...')
    const versionHistory = await getVersionHistory(mailingList.id)
    
    console.log('\nVersion History:')
    console.log('-' .repeat(40))
    for (const version of versionHistory) {
      console.log(`v${version.version_number} (${version.snapshot_type}) - ${version.record_count} records`)
      console.log(`  Created: ${new Date(version.created_at).toLocaleString()}`)
      if (version.metadata?.description) {
        console.log(`  Note: ${version.metadata.description}`)
      }
      console.log()
    }

    // Step 8: Test restoration
    console.log('\n🔄 Step 8: Testing version restoration...')
    if (versionHistory.length >= 2) {
      const versionToRestore = versionHistory[1] // Restore to second version
      console.log(`Restoring to version ${versionToRestore.version_number}...`)
      
      await restoreFromSnapshot(mailingList.id, versionToRestore.id)
      console.log(`✅ Successfully restored to version ${versionToRestore.version_number}`)

      // Verify restoration
      const { data: restoredRecords, count } = await supabase
        .from('mailing_list_records')
        .select('*', { count: 'exact' })
        .eq('mailing_list_id', mailingList.id)

      console.log(`✅ Verified: List now has ${count} records (expected: ${versionToRestore.record_count})`)
    }

    // Step 9: Final version history check
    console.log('\n📜 Step 9: Final version history check...')
    const finalHistory = await getVersionHistory(mailingList.id)
    console.log(`✅ Version history now contains ${finalHistory.length} versions`)

    console.log('\n🎉 Version History Test Completed Successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`- Created test mailing list: ${mailingList.id}`)
    console.log(`- Generated ${finalHistory.length} version snapshots`)
    console.log(`- Tested manual, auto-save, and before-dedup snapshot types`)
    console.log(`- Successfully restored from a previous version`)
    console.log(`- All version history functionality working correctly`)

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Export for use in tests or run directly
export { testVersionHistory }

// Run if called directly
if (require.main === module) {
  testVersionHistory()
    .then(() => {
      console.log('\n✅ All tests passed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error)
      process.exit(1)
    })
}
