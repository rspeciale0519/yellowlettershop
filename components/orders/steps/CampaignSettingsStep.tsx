"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Mail, Calendar, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { MailingOptionsStep } from './MailingOptionsStep'
import { CampaignSetupStep } from './CampaignSetupStep'

export function CampaignSettingsStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const [activeTab, setActiveTab] = useState<'mailing' | 'campaign'>('mailing')

  // Check completion status
  const hasMailingOptions = Boolean(
    orderState.campaignSettings?.mailingOptions ||
    orderState.mailingOptions
  )

  const hasCampaignSetup = Boolean(
    orderState.campaignSettings?.campaignOptions ||
    orderState.campaignOptions
  )

  // No auto-advancement - let user control tab navigation

  const canProceed = hasMailingOptions && hasCampaignSetup

  const handleMailingOptionsComplete = (mailingOptions: any) => {
    // Update the consolidated structure
    updateOrderState({
      campaignSettings: {
        mailingOptions,
        campaignOptions: orderState.campaignSettings?.campaignOptions || orderState.campaignOptions
      },
      // Also update legacy structure for compatibility
      mailingOptions
    })

    // Don't auto-advance tab - let user manually navigate
  }

  const handleCampaignSetupComplete = (campaignOptions: any) => {
    // Update the consolidated structure
    updateOrderState({
      campaignSettings: {
        mailingOptions: orderState.campaignSettings?.mailingOptions || orderState.mailingOptions,
        campaignOptions
      },
      // Also update legacy structure for compatibility
      campaignOptions
    })

    // Don't auto-advance - let user click Continue button to proceed
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Campaign Settings</h2>
        <p className="text-gray-600">
          Configure your mailing options and campaign delivery settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configure Your Campaign</span>
          </CardTitle>
          <CardDescription>
            Complete both sections to finalize your campaign configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'mailing' | 'campaign')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mailing" className="flex items-center space-x-2">
                {hasMailingOptions ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300 rounded-full" />
                )}
                <span>1. Mailing Options</span>
              </TabsTrigger>
              <TabsTrigger value="campaign" disabled={!hasMailingOptions} className="flex items-center space-x-2">
                {hasCampaignSetup ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : hasMailingOptions ? (
                  <div className="w-4 h-4 border border-gray-300 rounded-full" />
                ) : (
                  <div className="w-4 h-4 border border-gray-200 rounded-full bg-gray-100" />
                )}
                <span>2. Campaign Setup</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mailing" className="mt-6">
              <MailingOptionsStep
                orderState={{
                  ...orderState,
                  mailingOptions: orderState.campaignSettings?.mailingOptions || orderState.mailingOptions
                }}
                onMailingOptionsComplete={handleMailingOptionsComplete}
              />
            </TabsContent>

            <TabsContent value="campaign" className="mt-6">
              {hasMailingOptions ? (
                <CampaignSetupStep
                  orderState={{
                    ...orderState,
                    campaignOptions: orderState.campaignSettings?.campaignOptions || orderState.campaignOptions,
                    mailingOptions: orderState.campaignSettings?.mailingOptions || orderState.mailingOptions
                  }}
                  onCampaignSetupComplete={handleCampaignSetupComplete}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please configure your mailing options first before setting up the campaign schedule.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {hasMailingOptions ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className={`text-sm ${hasMailingOptions ? 'text-green-700' : 'text-gray-600'}`}>
                  Mailing Options Set
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                {hasCampaignSetup ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className={`text-sm ${hasCampaignSetup ? 'text-green-700' : 'text-gray-600'}`}>
                  Campaign Configured
                </span>
              </div>
            </div>
            {canProceed && (
              <div className="text-sm text-green-700 font-medium">
                Campaign ready!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      {hasMailingOptions && hasCampaignSetup && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Campaign Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Mailing Service</p>
                  <p className="text-xs text-green-600">
                    {orderState.campaignSettings?.mailingOptions?.serviceLevel || orderState.mailingOptions?.serviceLevel || 'Full Service'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Campaign Type</p>
                  <p className="text-xs text-green-600">
                    {orderState.campaignSettings?.campaignOptions?.isSplitCampaign || orderState.campaignOptions?.isSplitCampaign
                      ? 'Split Campaign' : 'Single Drop'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}