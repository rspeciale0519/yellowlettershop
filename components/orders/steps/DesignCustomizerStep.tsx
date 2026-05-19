"use client"

import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Palette, ExternalLink, Type, CheckCircle, AlertCircle } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'

// Phase 12 (Option A): the legacy embedded mini-editor was removed — the app
// now has ONE designer. This step shows saved-design status and routes to the
// full designer.
//
// Checkout ↔ designer round-trip contract:
//  - "Open Designer" → /design/customize?orderId=<id>
//  - The designer persists to sessionStorage `yls.pendingOrderDesign` and
//    returns to /orders/new?source=design_tool, which rehydrates this order.
//  - Linking the design to the order id on save is a tracked follow-up
//    (the /api/design/save route already accepts an optional orderId).
export function DesignCustomizerStep({ orderState }: OrderStepProps) {
  const { nextStep, previousStep } = useOrderWorkflow()
  const design = orderState.design
  const variables = design?.variablesUsed ?? []
  const hasDesign = Boolean(design && (design.designId || design.designJson))

  const openFullDesigner = () => {
    const orderId = orderState.orderId ? `?orderId=${encodeURIComponent(orderState.orderId)}` : ''
    window.open(`/design/customize${orderId}`, '_blank', 'noopener')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Design Your Mail Piece</h2>
        <p className="text-gray-600">
          Create or edit your design in the full designer, then return here to continue.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Design</span>
          </CardTitle>
          <CardDescription>
            The designer opens in a new tab. Your work is saved automatically and
            comes back to this order when you return.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasDesign ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Design saved. {variables.length} personalization variable
                {variables.length === 1 ? '' : 's'} detected.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No design yet — open the designer and save before continuing.
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={openFullDesigner} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Designer
          </Button>
        </CardContent>
      </Card>

      {variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Type className="h-5 w-5" />
              <span>Personalization Variables</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {variables.map((variable) => (
                <Badge key={variable} variant="outline" className="font-mono text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!hasDesign}>
          Continue to Mailing Options
        </Button>
      </div>
    </div>
  )
}
