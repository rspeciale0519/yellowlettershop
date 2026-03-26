"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useOrderWorkflow } from './OrderProvider'
import { OrderState, ORDER_STEPS } from '@/types/orders'
import { Lock } from 'lucide-react'

interface OrderNavigationProps {
  orderState: OrderState
}

export function OrderNavigation({ orderState }: OrderNavigationProps) {
  const { nextStep, previousStep, validateCurrentStep } = useOrderWorkflow()

  const currentStep = ORDER_STEPS.find(s => s.id === orderState.step)
  const nextStepConfig = ORDER_STEPS.find(s => s.id === orderState.step + 1)

  const validation = validateCurrentStep()
  const canProceed = validation.canProceed
  const isFirstStep = orderState.step === 1
  const isLastStep = orderState.step === ORDER_STEPS.length

  const getNextStepLabel = () => {
    if (isLastStep) {
      return 'Complete Order'
    }
    if (nextStepConfig) {
      return `Continue to ${nextStepConfig.name}`
    }
    return 'Continue'
  }

  const handleNextStep = () => {
    if (isLastStep) {
      // Handle order completion
      console.log('Completing order...')
      // This would typically call submitOrder() from the OrderProvider
    } else {
      nextStep()
    }
  }

  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={previousStep}
        disabled={isFirstStep}
      >
        Back
      </Button>

      <div className="flex space-x-3">
        <Button variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleNextStep}
          disabled={!canProceed}
          className={isLastStep ? "flex items-center space-x-2" : ""}
        >
          {isLastStep && <Lock className="h-4 w-4" />}
          <span>{getNextStepLabel()}</span>
        </Button>
      </div>
    </div>
  )
}