"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps, PricingBreakdown, OrderApproval } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  Download, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  FileText,
  Users,
  MapPin,
  Palette,
  Mail,
  Calendar,
  DollarSign,
  Lock,
  Shield
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'

export function ReviewApprovalStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const { toast } = useToast()
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null)
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [isGeneratingProof, setIsGeneratingProof] = useState(false)

  useEffect(() => {
    calculatePricing()
    generateProof()
  }, [])

  const calculatePricing = async () => {
    setIsCalculatingPricing(true)
    
    try {
      const response = await fetch('/api/orders/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderState
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate pricing')
      }

      const pricingData = await response.json()
      setPricing(pricingData)
      
      updateOrderState({
        pricing: pricingData
      })

    } catch (error) {
      console.error('Failed to calculate pricing:', error)
      toast({
        title: "Pricing calculation failed",
        description: "Unable to calculate order total. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCalculatingPricing(false)
    }
  }

  const generateProof = async () => {
    setIsGeneratingProof(true)
    
    try {
      const response = await fetch('/api/orders/proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderState
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate proof')
      }

      const result = await response.json()
      setProofUrl(result.proofUrl)

    } catch (error) {
      console.error('Failed to generate proof:', error)
      toast({
        title: "Proof generation failed",
        description: "Unable to generate order proof. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingProof(false)
    }
  }

  const handleApprovalChange = (field: string, value: boolean) => {
    const baseApproval: OrderApproval = orderState.approval ?? {
      designLocked: false,
      termsAccepted: false,
      approvedBy: 'current_user',
    }
    updateOrderState({
      approval: {
        ...baseApproval,
        [field]: value,
        approvedAt: value ? new Date() : undefined,
        approvedBy: 'current_user' // This would come from auth context
      }
    })
  }

  const downloadProof = async () => {
    if (!proofUrl) return

    try {
      const response = await fetch(proofUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `order-proof-${orderState.orderId || 'draft'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download proof.",
        variant: "destructive"
      })
    }
  }

  // Must stay in lockstep with validateCurrentStep's 'review' case, which is
  // what actually gates the Continue button. They disagreed before: this screen
  // demanded four boxes while the gate accepted two, so the red "complete all
  // approval items" banner could show above an enabled Continue button.
  const canProceed = () => {
    if (!orderState.approval) return false

    return orderState.approval.designLocked && orderState.approval.termsAccepted
  }

  const getServiceLevelDescription = () => {
    switch (orderState.mailingOptions?.serviceLevel) {
      case 'full_service':
        return 'Full Service: Print + Postage + Mail'
      case 'ship_processed':
        return 'Ship Processed: Print + Ship to You'
      case 'print_only':
        return 'Print Only: Digital Files'
      default:
        return 'Unknown Service'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Approval</h2>
        <p className="text-gray-600">
          Review your order details and approve for processing
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Order Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mailing List */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Mailing List</div>
                <div className="text-sm text-gray-600">
                  {orderState.accuzipValidation?.deliverableRecords || 0} deliverable addresses
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {orderState.listData?.dataSource?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Contact Card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Sender Information</div>
                <div className="text-sm text-gray-600">
                  {orderState.contactCard?.contactCardData.firstName} {orderState.contactCard?.contactCardData.lastName}
                </div>
              </div>
            </div>
            <Badge variant="outline">Contact Card</Badge>
          </div>

          {/* Design */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Design</div>
                <div className="text-sm text-gray-600">
                  {orderState.design?.isCustomDesign ? 'Custom Design' : 'Template Design'}
                  {orderState.design?.variablesUsed && orderState.design.variablesUsed.length > 0 && (
                    <span> • {orderState.design.variablesUsed.length} variables</span>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {orderState.design?.isCustomDesign ? 'Custom' : 'Template'}
            </Badge>
          </div>

          {/* Mailing Options */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Service Level</div>
                <div className="text-sm text-gray-600">
                  {getServiceLevelDescription()}
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {orderState.mailingOptions?.serviceLevel?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Campaign Options */}
          {(orderState.campaignOptions?.isSplitCampaign || orderState.campaignOptions?.isRepeating) && (
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">Campaign Settings</div>
                  <div className="text-sm text-gray-600">
                    {orderState.campaignOptions.isSplitCampaign && 
                      `${orderState.campaignOptions.splitConfig?.numberOfDrops} drops`}
                    {orderState.campaignOptions.isSplitCampaign && orderState.campaignOptions.isRepeating && ' • '}
                    {orderState.campaignOptions.isRepeating && 
                      `${orderState.campaignOptions.repeatConfig?.repetitions} repetitions`}
                  </div>
                </div>
              </div>
              <Badge variant="outline">Advanced</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Design Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Design Proof</span>
          </CardTitle>
          <CardDescription>
            Review your final design before production
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGeneratingProof ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating proof...</p>
            </div>
          ) : proofUrl ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Design Proof Ready</h4>
                    <p className="text-sm text-gray-600">
                      Review your design with live data before finalizing
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(proofUrl, '_blank')}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadProof}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review the proof carefully. Once you approve the design below, 
                  it will be locked and cannot be changed.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to generate proof. Please contact support if this issue persists.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      {pricing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Pricing Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base printing ({pricing.pricePerPiece?.toFixed(3)} × {orderState.accuzipValidation?.deliverableRecords || 0})</span>
                <span>${pricing.basePrice.toFixed(2)}</span>
              </div>
              
              {pricing.addOnServices.map((service) => (
                <div key={service.id} className="flex justify-between">
                  <span>{service.name} (${service.unitPrice.toFixed(2)} × {service.quantity})</span>
                  <span>${service.totalPrice.toFixed(2)}</span>
                </div>
              ))}
              
              {pricing.postageCharges > 0 && (
                <div className="flex justify-between">
                  <span>Postage charges</span>
                  <span>${pricing.postageCharges.toFixed(2)}</span>
                </div>
              )}
              
              {pricing.shippingCharges > 0 && (
                <div className="flex justify-between">
                  <span>Shipping charges</span>
                  <span>${pricing.shippingCharges.toFixed(2)}</span>
                </div>
              )}
              
              {pricing.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${pricing.taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${pricing.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isCalculatingPricing && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculating pricing...</p>
          </CardContent>
        </Card>
      )}

      {/* Approval Checkboxes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Final Approval</span>
          </CardTitle>
          <CardDescription>
            Please confirm both items before proceeding to payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="design-locked"
              checked={orderState.approval?.designLocked || false}
              onCheckedChange={(checked) => handleApprovalChange('designLocked', !!checked)}
            />
            <div className="flex-1">
              <Label htmlFor="design-locked" className="font-medium cursor-pointer">
                I approve this design. Once I continue, it is locked for production and cannot be changed.
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Please review the proof above carefully before checking this box.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-accepted"
              checked={orderState.approval?.termsAccepted || false}
              onCheckedChange={(checked) => handleApprovalChange('termsAccepted', !!checked)}
            />
            <div className="flex-1">
              <Label htmlFor="terms-accepted" className="font-medium cursor-pointer">
                I accept the Terms of Service and Privacy Policy, and I understand that all orders
                are non-refundable.
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Your mailing list data is handled according to our Privacy Policy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Validation */}
      {!canProceed() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please confirm both items above before proceeding to payment.
          </AlertDescription>
        </Alert>
      )}

      {canProceed() && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your order is ready for payment. Click continue to proceed to secure checkout.
          </AlertDescription>
        </Alert>
      )}

    </div>
  )
}