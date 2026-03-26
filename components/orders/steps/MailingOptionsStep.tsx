"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Mail, 
  Package, 
  MapPin, 
  CreditCard,
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  Ruler,
  DollarSign,
  Calculator
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'

export function MailingOptionsStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const { toast } = useToast()
  const [shippingAddress, setShippingAddress] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: ''
  })
  const [pricingEstimate, setPricingEstimate] = useState<any>(null)
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false)

  // Load user's default shipping address if available
  useEffect(() => {
    if (orderState.contactCard?.contactCardData) {
      setShippingAddress({
        address_line_1: orderState.contactCard.contactCardData.address.address_line_1,
        address_line_2: orderState.contactCard.contactCardData.address.address_line_2 || '',
        city: orderState.contactCard.contactCardData.address.city,
        state: orderState.contactCard.contactCardData.address.state,
        zip_code: orderState.contactCard.contactCardData.address.zip_code
      })
      
      // Auto-update if no mailing options set yet
      if (!orderState.mailingOptions) {
        updateOrderState({
          mailingOptions: {
            serviceLevel: 'full_service',
            includePostage: true,
            postageType: 'first_class_forever',
            mailPieceFormat: 'postcard_4x6',
            paperStock: 'standard_14pt',
            finish: 'matte',
            shippingAddress: orderState.contactCard.contactCardData.address
          }
        })
      }
    }
  }, [orderState.contactCard])

  const handleServiceLevelChange = (serviceLevel: 'full_service' | 'ship_processed' | 'print_only') => {
    updateOrderState({
      mailingOptions: {
        ...orderState.mailingOptions,
        serviceLevel,
        // Reset postage/shipping options based on service level
        includePostage: serviceLevel === 'full_service',
        shippingAddress: serviceLevel === 'print_only' ? undefined : shippingAddress
      }
    })
  }

  const handlePostageTypeChange = (postageType: 'first_class_forever' | 'first_class_discounted' | 'standard') => {
    updateOrderState({
      mailingOptions: {
        ...orderState.mailingOptions,
        postageType
      }
    })
    calculatePricing()
  }

  const handleFormatChange = (field: string, value: string) => {
    updateOrderState({
      mailingOptions: {
        ...orderState.mailingOptions,
        [field]: value
      }
    })
    calculatePricing()
  }

  const calculatePricing = async () => {
    if (!orderState.accuzipValidation?.deliverableRecords) return
    
    setIsCalculatingPricing(true)
    try {
      const response = await fetch('/api/orders/calculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailingOptions: orderState.mailingOptions,
          recordCount: orderState.accuzipValidation.deliverableRecords
        })
      })
      
      if (response.ok) {
        const pricing = await response.json()
        setPricingEstimate(pricing)
      }
    } catch (error) {
      console.error('Pricing calculation error:', error)
    } finally {
      setIsCalculatingPricing(false)
    }
  }

  // Calculate pricing when component mounts or key options change
  useEffect(() => {
    if (orderState.mailingOptions && orderState.accuzipValidation?.deliverableRecords) {
      calculatePricing()
    }
  }, [orderState.mailingOptions?.serviceLevel, orderState.accuzipValidation?.deliverableRecords])

  const handleIncludePostageChange = (includePostage: boolean) => {
    updateOrderState({
      mailingOptions: {
        ...orderState.mailingOptions,
        includePostage,
        postageType: includePostage ? 'first_class_forever' : undefined
      }
    })
  }

  const handleShippingAddressChange = (field: string, value: string) => {
    const updatedAddress = { ...shippingAddress, [field]: value }
    setShippingAddress(updatedAddress)
    
    updateOrderState({
      mailingOptions: {
        ...orderState.mailingOptions,
        shippingAddress: updatedAddress
      }
    })
  }

  const useContactCardAddress = () => {
    if (orderState.contactCard?.contactCardData) {
      const contactAddress = orderState.contactCard.contactCardData.address
      setShippingAddress({
        address_line_1: contactAddress.address_line_1,
        address_line_2: contactAddress.address_line_2 || '',
        city: contactAddress.city,
        state: contactAddress.state,
        zip_code: contactAddress.zip_code
      })
      
      updateOrderState({
        mailingOptions: {
          ...orderState.mailingOptions,
          shippingAddress: contactAddress
        }
      })
    }
  }

  const canProceed = () => {
    if (!orderState.mailingOptions?.serviceLevel) return false
    
    const { 
      serviceLevel, 
      includePostage, 
      shippingAddress: shipping,
      mailPieceFormat,
      paperStock,
      finish
    } = orderState.mailingOptions
    
    // For print_only, no additional requirements
    if (serviceLevel === 'print_only') return true
    
    // For ship_processed and full_service, need format options
    if (serviceLevel === 'ship_processed' || serviceLevel === 'full_service') {
      if (!mailPieceFormat || !paperStock || !finish) return false
      
      // Need shipping address
      if (!shipping?.address_line_1 || !shipping?.city || !shipping?.state || !shipping?.zip_code) {
        return false
      }
    }
    
    // For full_service, postage is required
    if (serviceLevel === 'full_service' && !includePostage) return false
    
    return true
  }

  const getServiceDescription = (service: string) => {
    switch (service) {
      case 'full_service':
        return 'We handle everything: printing, postage, and mailing'
      case 'ship_processed':
        return 'We print and ship to you for local mailing'
      case 'print_only':
        return 'Digital files only - you handle printing and mailing'
      default:
        return ''
    }
  }

  const getPostageDescription = (type: string) => {
    switch (type) {
      case 'first_class_forever':
        return 'Standard First-Class Forever stamps ($0.73 each)'
      case 'first_class_discounted':
        return 'Discounted First-Class postage (requires 200+ pieces, ~$0.60 each)'
      case 'standard':
        return 'Standard/Marketing Mail (bulk rates, 3-10 day delivery, ~$0.25 each)'
      default:
        return ''
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'postcard_4x6':
        return '4" x 6" postcard - Most economical option'
      case 'postcard_5x7':
        return '5" x 7" postcard - Larger format for more impact'
      case 'letter_8_5x11':
        return '8.5" x 11" letter - Full page format'
      case 'letter_folded':
        return '8.5" x 11" folded - Bi-fold or tri-fold options'
      default:
        return ''
    }
  }

  const getEstimatedDelivery = () => {
    if (!orderState.mailingOptions?.serviceLevel) return null
    
    const businessDays = {
      'full_service': { min: 5, max: 7 },
      'ship_processed': { min: 2, max: 3 },
      'print_only': { min: 0, max: 1 }
    }[orderState.mailingOptions.serviceLevel]
    
    if (!businessDays) return null
    
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + businessDays.max)
    
    return {
      text: businessDays.min === businessDays.max 
        ? `${businessDays.min} business day${businessDays.min === 1 ? '' : 's'}`
        : `${businessDays.min}-${businessDays.max} business days`,
      date: endDate.toLocaleDateString()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Mailing Options</h2>
        <p className="text-gray-600">
          Choose how you want your mail pieces processed and delivered
        </p>
      </div>

      {/* Service Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Service Level</span>
          </CardTitle>
          <CardDescription>
            Select the level of service you need for your mailing campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={orderState.mailingOptions?.serviceLevel || ''}
            onValueChange={handleServiceLevelChange}
          >
            <div className="space-y-4">
              {/* Full Service */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="full_service" id="full_service" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="full_service" className="text-base font-medium cursor-pointer">
                    Full Service Mailing
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {getServiceDescription('full_service')}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary">Printing Included</Badge>
                    <Badge variant="secondary">Postage Included</Badge>
                    <Badge variant="secondary">USPS Drop-off</Badge>
                  </div>
                </div>
              </div>

              {/* Ship Processed */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="ship_processed" id="ship_processed" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="ship_processed" className="text-base font-medium cursor-pointer">
                    Ship Processed
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {getServiceDescription('ship_processed')}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary">Printing Included</Badge>
                    <Badge variant="outline">Shipping to You</Badge>
                    <Badge variant="outline">You Mail Locally</Badge>
                  </div>
                </div>
              </div>

              {/* Print Only */}
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="print_only" id="print_only" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="print_only" className="text-base font-medium cursor-pointer">
                    Print-Ready Files Only
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {getServiceDescription('print_only')}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">Digital Download</Badge>
                    <Badge variant="outline">DIY Printing</Badge>
                    <Badge variant="outline">DIY Mailing</Badge>
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Mail Piece Format & Options */}
      {(orderState.mailingOptions?.serviceLevel === 'full_service' || 
        orderState.mailingOptions?.serviceLevel === 'ship_processed') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ruler className="h-5 w-5" />
              <span>Mail Piece Format</span>
            </CardTitle>
            <CardDescription>
              Choose the size and format for your mail pieces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">Format & Size</Label>
              <RadioGroup 
                value={orderState.mailingOptions?.mailPieceFormat || 'postcard_4x6'}
                onValueChange={(value) => handleFormatChange('mailPieceFormat', value)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                    <RadioGroupItem value="postcard_4x6" id="postcard_4x6" />
                    <Label htmlFor="postcard_4x6" className="cursor-pointer flex-1">
                      <div className="font-medium">4" x 6" Postcard</div>
                      <div className="text-sm text-gray-600">{getFormatDescription('postcard_4x6')}</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                    <RadioGroupItem value="postcard_5x7" id="postcard_5x7" />
                    <Label htmlFor="postcard_5x7" className="cursor-pointer flex-1">
                      <div className="font-medium">5" x 7" Postcard</div>
                      <div className="text-sm text-gray-600">{getFormatDescription('postcard_5x7')}</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                    <RadioGroupItem value="letter_8_5x11" id="letter_8_5x11" />
                    <Label htmlFor="letter_8_5x11" className="cursor-pointer flex-1">
                      <div className="font-medium">8.5" x 11" Letter</div>
                      <div className="text-sm text-gray-600">{getFormatDescription('letter_8_5x11')}</div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                    <RadioGroupItem value="letter_folded" id="letter_folded" />
                    <Label htmlFor="letter_folded" className="cursor-pointer flex-1">
                      <div className="font-medium">Folded Letter</div>
                      <div className="text-sm text-gray-600">{getFormatDescription('letter_folded')}</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Paper Stock */}
            <div>
              <Label className="text-base font-medium mb-3 block">Paper Stock</Label>
              <RadioGroup 
                value={orderState.mailingOptions?.paperStock || 'standard_14pt'}
                onValueChange={(value) => handleFormatChange('paperStock', value)}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard_14pt" id="standard_14pt" />
                    <Label htmlFor="standard_14pt" className="cursor-pointer">
                      <span className="font-medium">14pt Cardstock</span>
                      <span className="text-sm text-gray-600 ml-2">Standard thickness</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="premium_16pt" id="premium_16pt" />
                    <Label htmlFor="premium_16pt" className="cursor-pointer">
                      <span className="font-medium">16pt Cardstock</span>
                      <span className="text-sm text-gray-600 ml-2">Premium thickness (+$0.05/piece)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="luxury_18pt" id="luxury_18pt" />
                    <Label htmlFor="luxury_18pt" className="cursor-pointer">
                      <span className="font-medium">18pt Cardstock</span>
                      <span className="text-sm text-gray-600 ml-2">Luxury thickness (+$0.10/piece)</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Finish Options */}
            <div>
              <Label className="text-base font-medium mb-3 block">Finish</Label>
              <RadioGroup 
                value={orderState.mailingOptions?.finish || 'matte'}
                onValueChange={(value) => handleFormatChange('finish', value)}
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="matte" id="matte" />
                    <Label htmlFor="matte" className="cursor-pointer">Matte</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gloss" id="gloss" />
                    <Label htmlFor="gloss" className="cursor-pointer">Gloss (+$0.02/piece)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="uv_coating" id="uv_coating" />
                    <Label htmlFor="uv_coating" className="cursor-pointer">UV Coating (+$0.05/piece)</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Postage Options - Only show for full_service */}
      {orderState.mailingOptions?.serviceLevel === 'full_service' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Postage Options</span>
            </CardTitle>
            <CardDescription>
              Select the postage type for your mail pieces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-postage"
                checked={orderState.mailingOptions?.includePostage || false}
                onCheckedChange={handleIncludePostageChange}
              />
              <Label htmlFor="include-postage" className="font-medium">
                Include postage (required for full service)
              </Label>
            </div>

            {orderState.mailingOptions?.includePostage && (
              <RadioGroup 
                value={orderState.mailingOptions?.postageType || ''}
                onValueChange={handlePostageTypeChange}
              >
                <div className="space-y-3 ml-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first_class_forever" id="forever" />
                    <Label htmlFor="forever" className="cursor-pointer">
                      <div>
                        <div className="font-medium">First-Class Forever Stamps</div>
                        <div className="text-sm text-gray-600">
                          {getPostageDescription('first_class_forever')}
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first_class_discounted" id="discounted" />
                    <Label htmlFor="discounted" className="cursor-pointer">
                      <div>
                        <div className="font-medium">First-Class Discounted</div>
                        <div className="text-sm text-gray-600">
                          {getPostageDescription('first_class_discounted')}
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Standard Mail</div>
                        <div className="text-sm text-gray-600">
                          {getPostageDescription('standard')}
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Estimate */}
      {pricingEstimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Pricing Estimate</span>
            </CardTitle>
            <CardDescription>
              Estimated costs for {orderState.accuzipValidation?.deliverableRecords || 0} deliverable pieces
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCalculatingPricing ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Calculating pricing...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Printing:</span>
                      <span className="font-medium">${pricingEstimate.printing?.toFixed(2)}</span>
                    </div>
                    {pricingEstimate.postage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Postage:</span>
                        <span className="font-medium">${pricingEstimate.postage?.toFixed(2)}</span>
                      </div>
                    )}
                    {pricingEstimate.shipping && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">${pricingEstimate.shipping?.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {pricingEstimate.discount && (
                      <div className="flex justify-between text-green-600">
                        <span>Volume Discount:</span>
                        <span className="font-medium">-${pricingEstimate.discount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${pricingEstimate.total?.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${(pricingEstimate.total / (orderState.accuzipValidation?.deliverableRecords || 1)).toFixed(3)} per piece
                    </div>
                  </div>
                </div>
                
                {getEstimatedDelivery() && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Estimated delivery: {getEstimatedDelivery()?.text} (by {getEstimatedDelivery()?.date})
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipping Address - Only show for ship_processed and full_service */}
      {(orderState.mailingOptions?.serviceLevel === 'ship_processed' || 
        orderState.mailingOptions?.serviceLevel === 'full_service') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Shipping Address</span>
            </CardTitle>
            <CardDescription>
              {orderState.mailingOptions?.serviceLevel === 'ship_processed' 
                ? 'Where should we ship your printed mail pieces?'
                : 'Billing address for postage and shipping charges'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Use the same address as your contact card?
              </div>
              <Button variant="outline" size="sm" onClick={useContactCardAddress}>
                Use Contact Card Address
              </Button>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  value={shippingAddress.address_line_1}
                  onChange={(e) => handleShippingAddressChange('address_line_1', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={shippingAddress.address_line_2}
                  onChange={(e) => handleShippingAddressChange('address_line_2', e.target.value)}
                  placeholder="Suite 100"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                    placeholder="Anytown"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => handleShippingAddressChange('state', e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={shippingAddress.zip_code}
                    onChange={(e) => handleShippingAddressChange('zip_code', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Alerts */}
      {orderState.mailingOptions?.serviceLevel === 'full_service' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Full service includes CASS-certified addressing, printing, postage, and USPS drop-off. 
            Your mail will be processed and mailed within 3-5 business days.
          </AlertDescription>
        </Alert>
      )}

      {orderState.mailingOptions?.serviceLevel === 'ship_processed' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Printed mail pieces will be shipped to your address within 2-3 business days. 
            You'll need to apply postage and mail locally.
          </AlertDescription>
        </Alert>
      )}

      {orderState.mailingOptions?.serviceLevel === 'print_only' && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            You'll receive print-ready PDF files optimized for commercial printing. 
            Files will be available for download immediately after order completion.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {!canProceed() && orderState.mailingOptions?.serviceLevel && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required fields for your selected service level.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button 
          onClick={nextStep}
          disabled={!canProceed()}
        >
          {orderState.mailingOptions?.serviceLevel === 'full_service' 
            ? 'Continue to Campaign Setup'
            : 'Continue to Review'
          }
        </Button>
      </div>
    </div>
  )
}