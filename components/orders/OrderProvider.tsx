"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { OrderState, OrderWorkflowContextType, StepValidation, ORDER_STEPS, isStepRequired } from '@/types/orders'
import { applyOrderUpdate, approvalMatchesQuote, isPaymentForQuote } from '@/lib/orders/quote-state'
import { validateOrderStep } from '@/lib/orders/step-validation'
import { useToast } from '@/components/ui/use-toast'

const OrderWorkflowContext = createContext<OrderWorkflowContextType | undefined>(undefined)

interface OrderProviderProps {
  children: (orderState: OrderState) => React.ReactNode
  initialState?: Partial<OrderState>
}

export function OrderProvider({ children, initialState }: OrderProviderProps) {
  const { toast } = useToast()
  
  // Initialize order state with defaults
  const [orderState, setOrderState] = useState<OrderState>(() => ({
    // Workflow progress
    step: 1,
    totalSteps: ORDER_STEPS.length,
    currentStepValid: false,
    
    // Core workflow data
    listData: {
      useMailingData: true
    },
    
    // Order metadata
    isDraft: true,
    entryPoint: 'dashboard_create_new',
    
    // Validation
    validationErrors: {},
    
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // Override with any initial state
    ...initialState,
    pricing: undefined, payment: undefined, approval: undefined, quotePending: false, proofQuoteRevision: undefined, proofPending: false,
  }))

  const latestState = useRef(orderState)
  latestState.current = orderState
  const updateOrderState = useCallback((updates: Partial<OrderState>, expectedQuoteKey?: string) => {
    setOrderState(prev => applyOrderUpdate(prev, updates, expectedQuoteKey))
  }, [])

  // Navigation functions
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= ORDER_STEPS.length) {
      updateOrderState({ step, currentStepValid: false })
    }
  }, [updateOrderState])

  const nextStep = useCallback(() => {
    const currentStepValidation = validateOrderStep(orderState)
    
    if (!currentStepValidation.canProceed) {
      toast({
        title: "Cannot proceed",
        description: "Please complete all required fields before continuing.",
        variant: "destructive"
      })
      return
    }

    // Find next required step
    let nextStepNumber = orderState.step + 1
    while (nextStepNumber <= ORDER_STEPS.length) {
      const nextStepConfig = ORDER_STEPS.find(s => s.id === nextStepNumber)
      if (nextStepConfig && isStepRequired(nextStepConfig.key, orderState)) {
        break
      }
      nextStepNumber++
    }

    if (nextStepNumber <= ORDER_STEPS.length) {
      goToStep(nextStepNumber)
    }
  }, [orderState, goToStep, toast])

  const previousStep = useCallback(() => {
    // Find previous required step
    let prevStepNumber = orderState.step - 1
    while (prevStepNumber >= 1) {
      const prevStepConfig = ORDER_STEPS.find(s => s.id === prevStepNumber)
      if (prevStepConfig && isStepRequired(prevStepConfig.key, orderState)) {
        break
      }
      prevStepNumber--
    }

    if (prevStepNumber >= 1) {
      goToStep(prevStepNumber)
    }
  }, [orderState, goToStep])

  // Validation function
  const validateCurrentStep = useCallback((stateOverride?: OrderState): StepValidation => {
    const state = stateOverride ?? orderState
    return validateOrderStep(state)
  }, [orderState])

  // Save draft function
  const saveDraft = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/orders/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderState.orderId,
          orderState: {
            ...orderState,
            lastSaved: new Date()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const result = await response.json()
      
      updateOrderState({
        orderId: result.orderId,
        lastSaved: new Date()
      })

      toast({
        title: "Draft saved",
        description: "Your order has been saved and can be resumed later."
      })
    } catch (error) {
      console.error('Failed to save draft:', error)
      toast({
        title: "Save failed",
        description: "Unable to save draft. Please try again.",
        variant: "destructive"
      })
    }
  }, [orderState, updateOrderState, toast])

  useEffect(() => {
    if (!orderState.isDraft || !orderState.orderId) return
    const timer = setInterval(() => { void saveDraft() }, 30000)
    return () => clearInterval(timer)
  }, [orderState.isDraft, orderState.orderId, saveDraft])

  // Load draft function
  const loadDraft = useCallback(async (draftId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/drafts/${draftId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load draft')
      }

      const draftData = await response.json()
      setOrderState({ ...draftData.orderState, pricing: undefined, payment: undefined, approval: undefined, quotePending: false, proofQuoteRevision: undefined, proofPending: false, currentStepValid: false })

      toast({
        title: "Draft loaded",
        description: "Your saved order has been restored."
      })
    } catch (error) {
      console.error('Failed to load draft:', error)
      toast({
        title: "Load failed",
        description: "Unable to load draft. Please try again.",
        variant: "destructive"
      })
    }
  }, [toast])

  // Submit order function
  const submitOrder = useCallback(async (overrides?: Partial<OrderState>): Promise<{ success: boolean, orderId?: string, error?: string }> => {
    try {
      // Merge caller-provided overrides (e.g. the just-authorized payment) so
      // validation and submission run against the authoritative state, not a
      // stale React snapshot captured before the last updateOrderState().
      const effectiveState: OrderState = { ...latestState.current, ...overrides }
      if (!approvalMatchesQuote(effectiveState.approval, effectiveState.pricing) || !isPaymentForQuote(effectiveState.payment, effectiveState.pricing)) return { success: false, error: 'The quote or artwork changed. Review the order before submitting.' }

      // Final validation
      const finalValidation = validateCurrentStep(effectiveState)
      if (!finalValidation.isValid) {
        return {
          success: false,
          error: 'Order validation failed: ' + finalValidation.errors.join(', ')
        }
      }

      const response = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderState: {
            ...effectiveState,
            isDraft: false,
            submittedAt: new Date()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit order')
      }

      const result = await response.json()

      updateOrderState({
        orderId: result.orderId,
        isDraft: false
      })

      toast({
        title: "Order submitted!",
        description: "Your order has been successfully submitted for processing."
      })

      return {
        success: true,
        orderId: result.orderId
      }
    } catch (error) {
      console.error('Failed to submit order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }, [updateOrderState, validateCurrentStep, toast])

  // Context value
  const contextValue: OrderWorkflowContextType = {
    orderState,
    updateOrderState,
    goToStep,
    nextStep,
    previousStep,
    saveDraft,
    loadDraft,
    validateCurrentStep,
    submitOrder
  }

  return (
    <OrderWorkflowContext.Provider value={contextValue}>
      {children(orderState)}
    </OrderWorkflowContext.Provider>
  )
}

// Custom hook to use order workflow context
export function useOrderWorkflow() {
  const context = useContext(OrderWorkflowContext)
  if (context === undefined) {
    throw new Error('useOrderWorkflow must be used within an OrderProvider')
  }
  return context
}