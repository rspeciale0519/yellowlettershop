"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OrderState, OrderWorkflowContextType, StepValidation, ORDER_STEPS, isStepRequired } from '@/types/orders'
import { useToast } from '@/components/ui/use-toast'

const OrderWorkflowContext = createContext<OrderWorkflowContextType | undefined>(undefined)

interface OrderProviderProps {
  children: (orderState: OrderState) => React.ReactNode
  initialState?: Partial<OrderState>
}

export function OrderProvider({ children, initialState }: OrderProviderProps) {
  const router = useRouter()
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
    ...initialState
  }))

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (orderState.isDraft && orderState.orderId) {
        saveDraft()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [orderState.isDraft, orderState.orderId])

  // Update order state function
  const updateOrderState = useCallback((updates: Partial<OrderState>) => {
    setOrderState(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date()
    }))
  }, [])

  // Navigation functions
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= ORDER_STEPS.length) {
      updateOrderState({ step, currentStepValid: false })
    }
  }, [updateOrderState])

  const nextStep = useCallback(() => {
    const currentStepValidation = validateCurrentStep()
    
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
  }, [orderState.step, orderState, goToStep])

  // Validation function
  const validateCurrentStep = useCallback((stateOverride?: OrderState): StepValidation => {
    const state = stateOverride ?? orderState
    const currentStepConfig = ORDER_STEPS.find(s => s.id === state.step)
    if (!currentStepConfig) {
      return {
        isValid: false,
        errors: ['Invalid step'],
        warnings: [],
        canProceed: false,
        requiredFields: [],
        completedFields: []
      }
    }

    const errors: string[] = []
    const warnings: string[] = []
    const requiredFields: string[] = []
    const completedFields: string[] = []

    switch (currentStepConfig.key) {
      case 'data_and_mapping':
        // Validate data source selection
        const listData = state.dataAndMapping?.listData || state.listData
        const hasListData = Boolean(
          listData?.uploadedFile ||
          listData?.selectedListId ||
          listData?.manualRecords?.length ||
          listData?.melissaDataCriteria
        )

        if (!hasListData) {
          errors.push('Please select a data source')
        } else {
          completedFields.push('dataSource')
        }

        // Validate column mapping
        const columnMapping = state.dataAndMapping?.columnMapping || state.columnMapping
        if (!columnMapping || !columnMapping.mappedFields) {
          errors.push('Please map your columns to YLS fields')
        } else {
          const requiredMappings = ['first_name', 'last_name', 'address_line_1', 'city', 'state', 'zip_code']
          const mappedFieldKeys = Object.keys(columnMapping.mappedFields || {})
          const hasAllRequired = requiredMappings.every(field => mappedFieldKeys.includes(field))

          if (!hasAllRequired) {
            errors.push('Please map all required fields: First Name, Last Name, Address, City, State, and ZIP Code')
          } else {
            completedFields.push('columnMapping')
          }
        }
        break

      case 'address_validation':
        if (!state.accuzipValidation) {
          errors.push('Address validation is required')
        } else if (state.accuzipValidation.deliverableRecords === 0) {
          errors.push('No deliverable records found')
        } else {
          completedFields.push('accuzipValidation')
        }
        break

      case 'design_and_content':
        // Validate contact card selection
        const contactCard = state.designAndContent?.contactCard || state.contactCard
        if (!contactCard) {
          errors.push('Please select a contact card')
        } else {
          completedFields.push('contactCard')
        }

        // Validate design selection
        const design = state.designAndContent?.design || state.design
        if (!design) {
          errors.push('Please create or select a design')
        } else {
          completedFields.push('design')
        }
        break

      case 'campaign_settings':
        // Validate mailing options
        const mailingOptions = state.campaignSettings?.mailingOptions || state.mailingOptions
        if (!mailingOptions) {
          errors.push('Please select mailing options')
        } else if (!mailingOptions.serviceLevel) {
          errors.push('Please select a service level')
        } else {
          completedFields.push('mailingOptions')
        }

        // Validate campaign setup (if required)
        if (mailingOptions?.serviceLevel === 'full_service') {
          const campaignOptions = state.campaignSettings?.campaignOptions || state.campaignOptions
          if (!campaignOptions) {
            errors.push('Please configure campaign options')
          } else {
            completedFields.push('campaignOptions')
          }
        }
        break

      case 'review':
        requiredFields.push('approval')
        if (!state.approval) {
          errors.push('Please review and approve the order')
        } else if (!state.approval.designLocked || !state.approval.termsAccepted) {
          errors.push('Please confirm design lock and accept terms')
        } else {
          completedFields.push('approval')
        }
        break

      case 'payment':
        requiredFields.push('payment')
        if (!state.payment) {
          errors.push('Payment authorization required')
        } else if (state.payment.status !== 'authorized') {
          errors.push('Payment must be authorized to complete order')
        } else {
          completedFields.push('payment')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0,
      requiredFields,
      completedFields
    }
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

  // Load draft function
  const loadDraft = useCallback(async (draftId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/drafts/${draftId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load draft')
      }

      const draftData = await response.json()
      setOrderState(draftData.orderState)

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
      const effectiveState: OrderState = { ...orderState, ...overrides }

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
  }, [orderState, updateOrderState, validateCurrentStep, toast])

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