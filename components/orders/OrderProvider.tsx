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
  const validateCurrentStep = useCallback((): StepValidation => {
    const currentStepConfig = ORDER_STEPS.find(s => s.id === orderState.step)
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
        const listData = orderState.dataAndMapping?.listData || orderState.listData
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
        const columnMapping = orderState.dataAndMapping?.columnMapping || orderState.columnMapping
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

      case 'list_data':
        requiredFields.push('useMailingData')
        if (orderState.listData.useMailingData) {
          requiredFields.push('dataSource')
          if (!orderState.listData.dataSource) {
            errors.push('Please select a data source')
          } else {
            completedFields.push('dataSource')

            // Validate based on data source
            switch (orderState.listData.dataSource) {
              case 'upload':
                if (!orderState.listData.uploadedFile) {
                  errors.push('Please upload a file')
                } else {
                  completedFields.push('uploadedFile')
                }
                break
              case 'mlm_select':
                if (!orderState.listData.selectedListId) {
                  errors.push('Please select a mailing list')
                } else {
                  completedFields.push('selectedListId')
                }
                break
              case 'manual_entry':
                if (!orderState.listData.manualRecords || orderState.listData.manualRecords.length === 0) {
                  errors.push('Please add at least one recipient')
                } else {
                  completedFields.push('manualRecords')
                }
                break
            }
          }
        }
        break

      case 'column_mapping':
        if (!orderState.columnMapping) {
          errors.push('Column mapping is required')
        } else if (!orderState.columnMapping.mappedFields) {
          errors.push('Please map your columns to YLS fields')
        } else {
          completedFields.push('columnMapping')
        }
        break

      case 'address_validation':
        if (!orderState.accuzipValidation) {
          errors.push('Address validation is required')
        } else if (orderState.accuzipValidation.deliverableRecords === 0) {
          errors.push('No deliverable records found')
        } else {
          completedFields.push('accuzipValidation')
        }
        break

      case 'design_and_content':
        // Validate contact card selection
        const contactCard = orderState.designAndContent?.contactCard || orderState.contactCard
        if (!contactCard) {
          errors.push('Please select a contact card')
        } else {
          completedFields.push('contactCard')
        }

        // Validate design selection
        const design = orderState.designAndContent?.design || orderState.design
        if (!design) {
          errors.push('Please create or select a design')
        } else {
          completedFields.push('design')
        }
        break

      case 'campaign_settings':
        // Validate mailing options
        const mailingOptions = orderState.campaignSettings?.mailingOptions || orderState.mailingOptions
        if (!mailingOptions) {
          errors.push('Please select mailing options')
        } else if (!mailingOptions.serviceLevel) {
          errors.push('Please select a service level')
        } else {
          completedFields.push('mailingOptions')
        }

        // Validate campaign setup (if required)
        if (mailingOptions?.serviceLevel === 'full_service') {
          const campaignOptions = orderState.campaignSettings?.campaignOptions || orderState.campaignOptions
          if (!campaignOptions) {
            errors.push('Please configure campaign options')
          } else {
            completedFields.push('campaignOptions')
          }
        }
        break

      case 'review_and_approval':
        if (!orderState.approval) {
          errors.push('Please review and approve the order')
        } else if (!orderState.approval.designLocked || !orderState.approval.termsAccepted) {
          errors.push('Please confirm design lock and accept terms')
        } else {
          completedFields.push('approval')
        }
        break

      case 'accuzip_validation':
        if (!orderState.accuzipValidation) {
          errors.push('Address validation is required')
        } else if (orderState.accuzipValidation.deliverableRecords === 0) {
          errors.push('No deliverable records found')
        } else {
          completedFields.push('accuzipValidation')
        }
        break

      case 'contact_cards':
        requiredFields.push('contactCard')
        if (!orderState.contactCard) {
          errors.push('Please select a contact card')
        } else {
          completedFields.push('contactCard')
        }
        break

      case 'design':
        requiredFields.push('design')
        if (!orderState.design) {
          errors.push('Please create or select a design')
        } else {
          completedFields.push('design')
        }
        break

      case 'mailing_options':
        requiredFields.push('mailingOptions')
        if (!orderState.mailingOptions) {
          errors.push('Please select mailing options')
        } else if (!orderState.mailingOptions.serviceLevel) {
          errors.push('Please select a service level')
        } else {
          completedFields.push('mailingOptions')
        }
        break

      case 'campaign_setup':
        if (orderState.mailingOptions?.serviceLevel === 'full_service') {
          requiredFields.push('campaignOptions')
          if (!orderState.campaignOptions) {
            errors.push('Please configure campaign options')
          } else {
            completedFields.push('campaignOptions')
          }
        }
        break

      case 'review':
        requiredFields.push('approval')
        if (!orderState.approval) {
          errors.push('Please review and approve the order')
        } else if (!orderState.approval.designLocked || !orderState.approval.termsAccepted) {
          errors.push('Please confirm design lock and accept terms')
        } else {
          completedFields.push('approval')
        }
        break

      case 'payment':
        requiredFields.push('payment')
        if (!orderState.payment) {
          errors.push('Payment authorization required')
        } else if (orderState.payment.status !== 'authorized') {
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
  const submitOrder = useCallback(async (): Promise<{ success: boolean, orderId?: string, error?: string }> => {
    try {
      // Final validation
      const finalValidation = validateCurrentStep()
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
            ...orderState,
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