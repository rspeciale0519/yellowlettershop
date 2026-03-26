"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Lock,
  DollarSign,
  Clock,
  RefreshCw,
  ExternalLink,
  Receipt
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export function PaymentStep({ orderState }: OrderStepProps) {
  const { updateOrderState, submitOrder } = useOrderWorkflow()
  const { toast } = useToast()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true)
  const [pricingData, setPricingData] = useState<any>(null)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
    calculateFinalPricing()
  }, [])

  useEffect(() => {
    if (pricingData) {
      createPaymentIntent()
    }
  }, [pricingData])

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods')
      if (!response.ok) {
        throw new Error('Failed to load payment methods')
      }
      
      const methods = await response.json()
      setPaymentMethods(methods)
      
      // Auto-select default payment method if available
      const defaultMethod = methods.find((method: PaymentMethod) => method.isDefault)
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id)
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error)
      toast({
        title: "Payment methods load failed",
        description: "Unable to load your saved payment methods.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderState,
          amount: orderState.pricing?.totalPrice
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const result = await response.json()
      setPaymentIntent(result.clientSecret)
      
      updateOrderState({
        payment: {
          paymentIntentId: result.paymentIntentId,
          status: 'pending',
          amount: pricingData.total,
          currency: 'usd'
        }
      })

    } catch (error) {
      console.error('Failed to create payment intent:', error)
      toast({
        title: "Payment setup failed",
        description: "Unable to prepare payment processing.",
        variant: "destructive"
      })
    }
  }

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId)
  }

  const authorizePayment = async () => {
    if (!selectedPaymentMethod || !paymentIntent) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method.",
        variant: "destructive"
      })
      return
    }

    setIsProcessingPayment(true)

    try {
      // Authorize payment with Stripe
      const response = await fetch('/api/payments/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentIntentId: orderState.payment?.paymentIntentId,
          paymentMethodId: selectedPaymentMethod,
          orderState
        })
      })

      if (!response.ok) {
        throw new Error('Payment authorization failed')
      }

      const result = await response.json()
      
      if (result.status === 'requires_action') {
        // Handle 3D Secure or other authentication
        toast({
          title: "Additional authentication required",
          description: "Please complete the additional authentication step.",
          variant: "destructive"
        })
        return
      }

      if (result.status === 'succeeded') {
        // Payment authorized successfully
        updateOrderState({
          payment: {
            ...orderState.payment,
            status: 'authorized',
            paymentMethodId: selectedPaymentMethod,
            authorizedAt: new Date()
          }
        })

        // Submit the complete order
        const submitResult = await submitOrder()
        
        if (submitResult.success) {
          toast({
            title: "Order submitted successfully!",
            description: "Your order has been placed and will be processed within 24 hours."
          })
          
          // Redirect to success page
          router.push(`/orders/${submitResult.orderId}/success`)
        } else {
          throw new Error(submitResult.error || 'Order submission failed')
        }
      } else {
        throw new Error('Payment authorization failed')
      }

    } catch (error) {
      console.error('Payment authorization error:', error)
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const addNewPaymentMethod = () => {
    // Open Stripe payment method setup
    window.open('/account/payment-methods?add=true', '_blank')
  }

  const canProceed = () => {
    return selectedPaymentMethod && paymentIntent && pricingData && !isCalculatingPrice
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
        <p className="text-gray-600">
          Complete your order with secure payment processing
        </p>
      </div>

      {/* Order Total Summary */}
      {orderState.pricing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Receipt className="h-5 w-5" />
              <span>Order Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-3xl font-bold text-blue-900">
                  ${orderState.pricing.totalPrice.toFixed(2)}
                </div>
                <div className="text-sm text-blue-700">
                  {orderState.accuzipValidation?.deliverableRecords || 0} mail pieces • 
                  {orderState.mailingOptions?.serviceLevel?.replace('_', ' ')}
                </div>
              </div>
              
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Ready to Pay
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Method</span>
          </CardTitle>
          <CardDescription>
            Select or add a payment method for this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPaymentMethods ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading payment methods...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {method.brand.toUpperCase()} ending in {method.last4}
                          </div>
                          <div className="text-sm text-gray-600">
                            Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                          </div>
                        </div>
                      </div>
                      
                      {selectedPaymentMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
                  <p className="text-gray-600 mb-4">
                    Add a payment method to complete your order
                  </p>
                </div>
              )}
              
              <Button
                variant="outline"
                className="w-full flex items-center space-x-2"
                onClick={addNewPaymentMethod}
              >
                <CreditCard className="h-4 w-4" />
                <span>Add New Payment Method</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Secure Payment Processing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">SSL Encrypted</div>
                <div className="text-sm text-gray-600">256-bit encryption</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">PCI Compliant</div>
                <div className="text-sm text-gray-600">Secure card processing</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Payment Hold</div>
                <div className="text-sm text-gray-600">Authorized, not charged</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Charge on Approval</div>
                <div className="text-sm text-gray-600">After proof approval</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Process Information */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>Payment Authorization:</strong> Your card will be authorized for the full amount, 
          but not charged until you approve the final proof. This ensures you're satisfied with 
          the design before payment is captured.
        </AlertDescription>
      </Alert>

      {/* Error States */}
      {!paymentIntent && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to prepare payment processing. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      )}

      {paymentMethods.length === 0 && !isLoadingPaymentMethods && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please add a payment method before proceeding with your order.
          </AlertDescription>
        </Alert>
      )}

      {/* Final Payment Button */}
      <Card className="bg-gray-50">
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Complete Order</h3>
              <p className="text-gray-600">
                Click below to authorize payment and submit your order for processing
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={authorizePayment}
              disabled={!canProceed() || isProcessingPayment}
              className="flex items-center space-x-2"
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>Authorize Payment & Submit Order</span>
                </>
              )}
            </Button>
            
            {orderState.pricing && (
              <p className="text-sm text-gray-500">
                Authorizing ${orderState.pricing.totalPrice.toFixed(2)} • 
                Card will not be charged until proof approval
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}