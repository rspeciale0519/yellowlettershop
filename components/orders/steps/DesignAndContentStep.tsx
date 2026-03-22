"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { ContactCardsStep } from './ContactCardsStep'
import { DesignCustomizerStep } from './DesignCustomizerStep'

export function DesignAndContentStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const [activeTab, setActiveTab] = useState<'contact' | 'design'>('contact')

  // Check completion status
  const hasContactCard = Boolean(
    orderState.designAndContent?.contactCard ||
    orderState.contactCard
  )

  const hasDesign = Boolean(
    orderState.designAndContent?.design ||
    orderState.design
  )

  // No auto-advancement - let user control tab navigation

  const canProceed = hasContactCard && hasDesign

  const handleContactCardComplete = (contactCard: any) => {
    // Update the consolidated structure
    updateOrderState({
      designAndContent: {
        contactCard,
        design: orderState.designAndContent?.design || orderState.design
      },
      // Also update legacy structure for compatibility
      contactCard
    })

    // Don't auto-advance tab - let user manually navigate
  }

  const handleDesignComplete = (design: any) => {
    // Update the consolidated structure
    updateOrderState({
      designAndContent: {
        contactCard: orderState.designAndContent?.contactCard || orderState.contactCard,
        design
      },
      // Also update legacy structure for compatibility
      design
    })

    // Don't auto-advance - let user click Continue button to proceed
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Design & Content</h2>
        <p className="text-gray-600">
          Choose your contact information and customize your mail piece design
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Customize Your Mail Piece</span>
          </CardTitle>
          <CardDescription>
            Complete both steps to finalize your mail piece content and design
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'contact' | 'design')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contact" className="flex items-center space-x-2">
                {hasContactCard ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300 rounded-full" />
                )}
                <span>1. Contact Information</span>
              </TabsTrigger>
              <TabsTrigger value="design" disabled={!hasContactCard} className="flex items-center space-x-2">
                {hasDesign ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : hasContactCard ? (
                  <div className="w-4 h-4 border border-gray-300 rounded-full" />
                ) : (
                  <div className="w-4 h-4 border border-gray-200 rounded-full bg-gray-100" />
                )}
                <span>2. Design Customization</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="mt-6">
              <ContactCardsStep
                orderState={{
                  ...orderState,
                  contactCard: orderState.designAndContent?.contactCard || orderState.contactCard
                }}
                onContactCardComplete={handleContactCardComplete}
              />
            </TabsContent>

            <TabsContent value="design" className="mt-6">
              {hasContactCard ? (
                <DesignCustomizerStep
                  orderState={{
                    ...orderState,
                    design: orderState.designAndContent?.design || orderState.design,
                    contactCard: orderState.designAndContent?.contactCard || orderState.contactCard
                  }}
                  onDesignComplete={handleDesignComplete}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select your contact information first before customizing the design.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {hasContactCard ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className={`text-sm ${hasContactCard ? 'text-green-700' : 'text-gray-600'}`}>
                  Contact Information Selected
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                {hasDesign ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                <span className={`text-sm ${hasDesign ? 'text-green-700' : 'text-gray-600'}`}>
                  Design Customized
                </span>
              </div>
            </div>
            {canProceed && (
              <div className="text-sm text-green-700 font-medium">
                Design ready!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      {hasContactCard && hasDesign && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-12 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
                <Palette className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Mail piece design complete
                </p>
                <p className="text-xs text-green-600">
                  Contact card and design customization finished
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}