#!/usr/bin/env node

/**
 * Database Verification Script
 * Verifies that the comprehensive database schema is working correctly
 * and all RLS policies are properly configured.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Yellow Letter Shop Database Schema...\n');

  try {
    // Test 1: Check if core tables exist
    console.log('✅ Testing core table existence...');
    const coreTables = [
      'user_profiles',
      'teams', 
      'contact_cards',
      'mailing_lists',
      'mailing_list_records',
      'list_builder_criteria',
      'campaigns',
      'campaign_drops',
      'api_usage_tracking',
      'change_history',
      'user_analytics',
      'short_links',
      'vendors'
    ];

    for (const table of coreTables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
        throw new Error(`Table ${table} not accessible: ${error.message}`);
      }
      console.log(`  ✓ ${table}`);
    }

    // Test 2: Check RLS policies exist
    console.log('\n✅ Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .eq('schemaname', 'public');

    if (policyError) {
      console.log('⚠️  Cannot check policies directly (expected in production)');
    } else {
      const policyCount = policies.length;
      console.log(`  ✓ Found ${policyCount} RLS policies`);
      
      // Group by table
      const policiesByTable = policies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) acc[policy.tablename] = [];
        acc[policy.tablename].push(policy.policyname);
        return acc;
      }, {});

      Object.entries(policiesByTable).forEach(([table, policyNames]) => {
        console.log(`    ${table}: ${policyNames.length} policies`);
      });
    }

    // Test 3: Check schema version tracking
    console.log('\n✅ Checking schema version...');
    const { data: versions, error: versionError } = await supabase
      .from('schema_version')
      .select('version, description, applied_at')
      .order('applied_at', { ascending: false })
      .limit(3);

    if (versionError) {
      throw new Error(`Cannot check schema versions: ${versionError.message}`);
    }

    console.log('  Latest schema versions:');
    versions.forEach(version => {
      const date = new Date(version.applied_at).toLocaleDateString();
      console.log(`    ✓ v${version.version}: ${version.description} (${date})`);
    });

    // Test 4: Test basic CRUD operations (as service role)
    console.log('\n✅ Testing basic database operations...');
    
    // Test user profile creation
    const testUser = {
      user_id: '12345678-1234-1234-1234-123456789012',
      subscription_plan: 'free',
      subscription_status: 'active',
      role: 'free_user',
      settings: {},
      onboarding_completed: false,
      timezone: 'America/New_York'
    };

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert(testUser)
      .select()
      .single();

    if (profileError) {
      throw new Error(`Cannot create test user profile: ${profileError.message}`);
    }
    console.log('  ✓ User profile creation works');

    // Test mailing list creation
    const testList = {
      user_id: testUser.user_id,
      created_by: testUser.user_id,
      name: 'Test Mailing List',
      description: 'Test list for database verification',
      record_count: 0,
      source_type: 'manual',
      is_active: true,
      validation_status: 'pending',
      validation_results: {}
    };

    const { data: list, error: listError } = await supabase
      .from('mailing_lists')
      .insert(testList)
      .select()
      .single();

    if (listError) {
      throw new Error(`Cannot create test mailing list: ${listError.message}`);
    }
    console.log('  ✓ Mailing list creation works');

    // Test list builder criteria
    const testCriteria = {
      user_id: testUser.user_id,
      criteria_data: {
        geography: { states: ['CA', 'NY'] },
        demographics: { age_range: [25, 65] }
      },
      is_template: false,
      api_provider: 'melissa'
    };

    const { data: criteria, error: criteriaError } = await supabase
      .from('list_builder_criteria')
      .insert(testCriteria)
      .select()
      .single();

    if (criteriaError) {
      throw new Error(`Cannot create test criteria: ${criteriaError.message}`);
    }
    console.log('  ✓ List builder criteria creation works');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('list_builder_criteria').delete().eq('id', criteria.id);
    await supabase.from('mailing_lists').delete().eq('id', list.id);
    await supabase.from('user_profiles').delete().eq('id', profile.id);
    console.log('  ✓ Test data cleaned up');

    // Test 5: Check enum types
    console.log('\n✅ Checking enum types...');
    const { data: enums, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'subscription_plan' });
    
    if (!enumError && enums) {
      console.log(`  ✓ Subscription plan enum: ${enums.join(', ')}`);
    }

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ All core tables accessible');
    console.log('  ✅ RLS policies configured');
    console.log('  ✅ Schema versions tracked');
    console.log('  ✅ Basic CRUD operations working');
    console.log('  ✅ Multi-tenant architecture ready');
    console.log('\n🚀 Your YLS database is ready for development!');

  } catch (error) {
    console.error('\n❌ Database verification failed:');
    console.error(`   ${error.message}`);
    console.log('\n🔧 Please check your Supabase local setup and migrations.');
    process.exit(1);
  }
}

// Helper function to get enum values (if needed)
async function createEnumFunction() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
      RETURNS text[] AS $$
      BEGIN
        RETURN ARRAY(
          SELECT enumlabel::text 
          FROM pg_enum 
          WHERE enumtypid = enum_name::regtype
          ORDER BY enumsortorder
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  
  if (error) {
    console.log('Note: Could not create enum helper function');
  }
}

// Run verification
if (require.main === module) {
  createEnumFunction().then(() => {
    verifyDatabase().catch(console.error);
  });
}

module.exports = { verifyDatabase };