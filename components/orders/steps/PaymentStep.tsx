"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps, PricingBreakdown, PaymentData } from '@/types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Lock, RefreshCw, Receipt } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { PaymentSecurityInfo } from './payment/PaymentSecurityInfo'
import { PaymentMethodList, type PaymentMethod } from './payment/PaymentMethodList'

export function PaymentStep({ orderState }: OrderStepProps) {
  const { updateOrderState, submitOrder } = useOrderWorkflow()
  const { toast } = useToast()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true)
  const [pricingData, setPricingData] = useState<PricingBreakdown | null>(null)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)

  const calculateFinalPricing = async () => {
    setIsCalculatingPrice(true)
    try {
      const response = await fetch('/api/orders/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderState })
      })
      if (!response.ok) {
        throw new Error('Failed to calculate final pricing')
      }
      const data: PricingBreakdown = await response.json()
      setPricingData(data)
      updateOrderState({ pricing: data })
    } catch (error) {
      console.error('Failed to calculate final pricing:', error)
      toast({
        title: "Pricing calculation failed",
        description: "Unable to calculate your order total. Please go back and try again.",
        variant: "destructive"
      })
    } finally {
      setIsCalculatingPrice(false)
    }
  }

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
          amount: pricingData?.totalPrice ?? orderState.pricing?.totalPrice
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
          amount: pricingData?.totalPrice ?? 0,
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
        const basePayment: PaymentData = orderState.payment ?? {
          status: 'authorized',
          amount: pricingData?.totalPrice ?? orderState.pricing?.totalPrice ?? 0,
          currency: 'usd',
        }
        updateOrderState({
          payment: {
            ...basePayment,
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
      <PaymentMethodList
        methods={paymentMethods}
        selectedId={selectedPaymentMethod}
        isLoading={isLoadingPaymentMethods}
        onSelect={handlePaymentMethodSelect}
        onAddNew={addNewPaymentMethod}
      />

      {/* Security information + authorization explainer */}
      <PaymentSecurityInfo />

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