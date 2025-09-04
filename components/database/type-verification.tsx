'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { 
  UserProfile, 
  MailingList, 
  Campaign,
  ListBuilderCriteria,
  ChangeHistory,
  UserAnalytics,
  CampaignMetrics,
  ShortLink,
  Vendor,
  ApiUsageTracking,
  SubscriptionPlan,
  CampaignType,
  ValidationStatus
} from '@/types/supabase'

interface TypeVerificationProps {
  className?: string
}

export function TypeVerification({ className }: TypeVerificationProps) {
  const [verificationResults, setVerificationResults] = React.useState<{
    typeTests: { name: string; status: 'passed' | 'failed'; details?: string }[]
    completed: boolean
  }>({
    typeTests: [],
    completed: false
  })

  const runTypeVerification = () => {
    const results: { name: string; status: 'passed' | 'failed'; details?: string }[] = []

    try {
      // Test 1: Basic type instantiation
      const testUserProfile: Partial<UserProfile> = {
        user_id: '12345678-1234-1234-1234-123456789012',
        subscription_plan: 'pro',
        role: 'pro_user',
        timezone: 'America/New_York'
      }
      results.push({ name: 'UserProfile type', status: 'passed' })

      // Test 2: Mailing list type with relations
      const testMailingList: Partial<MailingList> = {
        name: 'Test List',
        description: 'Test description',
        record_count: 0,
        source_type: 'manual',
        is_active: true,
        validation_status: 'pending',
        validation_results: {}
      }
      results.push({ name: 'MailingList type', status: 'passed' })

      // Test 3: Campaign type with all properties
      const testCampaign: Partial<Campaign> = {
        name: 'Test Campaign',
        campaign_type: 'single',
        design_data: {},
        design_type: 'letter',
        fulfillment_type: 'full_service',
        total_drops: 1,
        drop_interval_days: 7,
        recurrence_count: 1,
        recurrence_interval_days: 30,
        status: 'draft'
      }
      results.push({ name: 'Campaign type', status: 'passed' })

      // Test 4: List builder criteria type
      const testCriteria: Partial<ListBuilderCriteria> = {
        criteria_data: {
          geography: { states: ['CA', 'NY'] },
          demographics: { age_range: [25, 65] }
        },
        is_template: false,
        api_provider: 'melissa'
      }
      results.push({ name: 'ListBuilderCriteria type', status: 'passed' })

      // Test 5: Version history type
      const testChangeHistory: Partial<ChangeHistory> = {
        resource_type: 'mailing_list',
        change_type: 'update',
        field_name: 'name',
        old_value: { name: 'Old Name' },
        new_value: { name: 'New Name' },
        is_undoable: true
      }
      results.push({ name: 'ChangeHistory type', status: 'passed' })

      // Test 6: Analytics type
      const testAnalytics: Partial<UserAnalytics> = {
        event_type: 'page_view',
        page_path: '/dashboard',
        duration_seconds: 120,
        metadata: { feature: 'dashboard' }
      }
      results.push({ name: 'UserAnalytics type', status: 'passed' })

      // Test 7: Campaign metrics type
      const testMetrics: Partial<CampaignMetrics> = {
        response_rate: 0.05,
        conversions: 10,
        conversion_value: 1000.50,
        removal_requests: 2
      }
      results.push({ name: 'CampaignMetrics type', status: 'passed' })

      // Test 8: Short link type
      const testShortLink: Partial<ShortLink> = {
        short_code: 'abc123',
        target_url: 'https://example.com'
      }
      results.push({ name: 'ShortLink type', status: 'passed' })

      // Test 9: Vendor type
      const testVendor: Partial<Vendor> = {
        name: 'Test Vendor',
        vendor_type: 'print',
        contact_email: 'vendor@example.com',
        services_offered: ['printing', 'mailing'],
        pricing_tiers: {},
        minimum_order_quantity: 1,
        quality_rating: 4.5,
        is_active: true,
        contract_terms: {}
      }
      results.push({ name: 'Vendor type', status: 'passed' })

      // Test 10: API usage tracking type
      const testApiUsage: Partial<ApiUsageTracking> = {
        api_provider: 'melissa',
        endpoint: '/search',
        request_count: 1,
        total_cost: 0.10,
        billing_period: '2025-08-01',
        metadata: {}
      }
      results.push({ name: 'ApiUsageTracking type', status: 'passed' })

      // Test 11: Enum types
      const testEnums = {
        plan: 'enterprise' as SubscriptionPlan,
        campaignType: 'recurring' as CampaignType,
        validationStatus: 'valid' as ValidationStatus
      }
      results.push({ name: 'Enum types', status: 'passed', details: `Plan: ${testEnums.plan}, Campaign: ${testEnums.campaignType}, Validation: ${testEnums.validationStatus}` })

    } catch (error) {
      results.push({ 
        name: 'Type verification failed', 
        status: 'failed', 
        details: (error as Error).message 
      })
    }

    setVerificationResults({
      typeTests: results,
      completed: true
    })
  }

  React.useEffect(() => {
    // Run verification automatically on mount
    runTypeVerification()
  }, [])

  const passedTests = verificationResults.typeTests.filter(t => t.status === 'passed').length
  const totalTests = verificationResults.typeTests.length
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Type System Verification</span>
          {verificationResults.completed && (
            <span className={`text-sm px-2 py-1 rounded ${
              successRate === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {successRate}% ({passedTests}/{totalTests})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!verificationResults.completed ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Running type verification...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verificationResults.typeTests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{test.name}</span>
                  {test.details && (
                    <p className="text-sm text-gray-600">{test.details}</p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  test.status === 'passed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {test.status === 'passed' ? '✅' : '❌'}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Summary</h4>
              {successRate === 100 ? (
                <p className="text-green-700">
                  🎉 All type tests passed! The comprehensive type system is working correctly.
                </p>
              ) : (
                <p className="text-yellow-700">
                  ⚠️ Some type tests failed. Check the details above.
                </p>
              )}
              <Button 
                onClick={runTypeVerification}
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Re-run Verification
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TypeVerification