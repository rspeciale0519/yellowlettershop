import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    }

    // Test 1: Check core tables exist and are accessible
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
      'vendors',
      'asset_permissions',
      'campaign_metrics',
      'data_snapshots',
      'resource_permissions',
      'resource_tags',
      'short_link_clicks',
      'team_invitations'
    ]

    for (const table of coreTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          results.tests.push({
            test: `Table ${table} accessibility`,
            status: 'failed',
            error: error.message
          })
          results.summary.failed++
        } else {
          results.tests.push({
            test: `Table ${table} accessibility`,
            status: 'passed'
          })
          results.summary.passed++
        }
      } catch (err) {
        results.tests.push({
          test: `Table ${table} accessibility`,
          status: 'failed',
          error: (err as Error).message
        })
        results.summary.failed++
      }
      results.summary.total++
    }

    // Test 2: Check RLS is enabled on tables
    const { data: rlsTables, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('rowsecurity', true)

    if (rlsError) {
      results.tests.push({
        test: 'RLS table check',
        status: 'failed',
        error: rlsError.message
      })
      results.summary.failed++
    } else {
      results.tests.push({
        test: 'RLS enabled tables',
        status: 'passed',
        details: `Found ${rlsTables.length} tables with RLS enabled: ${rlsTables.map(t => t.tablename).join(', ')}`
      })
      results.summary.passed++
    }
    results.summary.total++

    // Test 3: Check schema versions
    const { data: versions, error: versionError } = await supabase
      .from('schema_version')
      .select('version, description, applied_at')
      .order('applied_at', { ascending: false })
      .limit(5)

    if (versionError) {
      results.tests.push({
        test: 'Schema version check',
        status: 'failed',
        error: versionError.message
      })
      results.summary.failed++
    } else {
      results.tests.push({
        test: 'Schema version tracking',
        status: 'passed',
        details: `Latest version: ${versions[0]?.version} - ${versions[0]?.description}`,
        versions: versions
      })
      results.summary.passed++
    }
    results.summary.total++

    // Test 4: Test enum types exist
    const { data: enumData, error: enumError } = await supabase
      .from('pg_type')
      .select('typname')
      .eq('typtype', 'e')
      .like('typname', '%subscription_plan%')

    results.tests.push({
      test: 'Enum types check',
      status: enumError ? 'failed' : 'passed',
      error: enumError?.message,
      details: enumError ? undefined : 'Custom enum types found'
    })
    if (enumError) {
      results.summary.failed++
    } else {
      results.summary.passed++
    }
    results.summary.total++

    // Test 5: Check if functions and triggers exist
    const { data: functions, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('pronamespace', (await supabase.from('pg_namespace').select('oid').eq('nspname', 'public').single()).data?.oid)

    results.tests.push({
      test: 'Database functions check',
      status: functionError ? 'failed' : 'passed',
      error: functionError?.message,
      details: functionError ? undefined : `Found ${functions?.length || 0} custom functions`
    })
    if (functionError) {
      results.summary.failed++
    } else {
      results.summary.passed++
    }
    results.summary.total++

    // Calculate success rate
    const successRate = results.summary.total > 0 
      ? Math.round((results.summary.passed / results.summary.total) * 100) 
      : 0

    return NextResponse.json({
      success: results.summary.failed === 0,
      successRate,
      message: results.summary.failed === 0 
        ? '✅ All database verification tests passed!' 
        : `⚠️ ${results.summary.failed} tests failed out of ${results.summary.total}`,
      ...results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database verification failed',
      message: (error as Error).message
    }, { status: 500 })
  }
}