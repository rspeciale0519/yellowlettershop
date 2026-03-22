"use client"

import React from 'react'
import { OrderState, ORDER_STEPS, isStepRequired } from '@/types/orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react'
import { useOrderWorkflow } from './OrderProvider'

interface OrderStepperProps {
  currentStep: number
  orderState: OrderState
  className?: string
}

export function OrderStepper({ currentStep, orderState, className = '' }: OrderStepperProps) {
  const { goToStep, validateCurrentStep } = useOrderWorkflow()
  const currentValidation = validateCurrentStep()

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      return 'completed'
    } else if (stepNumber === currentStep) {
      // Use gentler states for current step
      return currentValidation.isValid ? 'current_valid' : 'current_waiting'
    } else {
      return 'upcoming'
    }
  }

  const getStepIcon = (stepNumber: number, status: string) => {
    const iconClass = "h-5 w-5"

    switch (status) {
      case 'completed':
        return <CheckCircle className={`${iconClass} text-green-600`} />
      case 'current_valid':
        return <CheckCircle className={`${iconClass} text-yellow-600`} style={{ color: '#E0B431' }} />
      case 'current_waiting':
        return <Clock className={`${iconClass} text-blue-500`} />
      case 'upcoming':
        return <Circle className={`${iconClass}`} style={{ color: '#A6A3A3' }} />
      default:
        return <Circle className={`${iconClass}`} style={{ color: '#A6A3A3' }} />
    }
  }

  const getStepTextColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700'
      case 'current_valid':
        return 'font-medium'
      case 'current_waiting':
        return 'font-medium'
      case 'upcoming':
        return ''
      default:
        return ''
    }
  }

  const canNavigateToStep = (stepNumber: number) => {
    // Can navigate backward to any completed step
    if (stepNumber < currentStep) return true
    
    // Can't navigate forward beyond current step
    if (stepNumber > currentStep) return false
    
    // Current step is always accessible
    return stepNumber === currentStep
  }

  const handleStepClick = (stepNumber: number) => {
    if (canNavigateToStep(stepNumber)) {
      goToStep(stepNumber)
    }
  }

  // Filter steps based on order configuration
  const visibleSteps = ORDER_STEPS.filter(step => isStepRequired(step.key, orderState))

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep} of {visibleSteps.length}</span>
          <span>{Math.round((currentStep / visibleSteps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(currentStep / visibleSteps.length) * 100}%`,
              backgroundColor: '#F6CF62'
            }}
          />
        </div>
      </div>

      {/* Desktop stepper */}
      <div className="hidden lg:block">
        <nav aria-label="Order workflow progress">
          <ol className="flex items-center justify-between">
            {visibleSteps.map((step, index) => {
              const status = getStepStatus(step.id)
              const isClickable = canNavigateToStep(step.id)
              
              return (
                <li key={step.id} className="flex-1">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isClickable 
                          ? 'hover:bg-gray-50 cursor-pointer' 
                          : 'cursor-not-allowed'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getStepIcon(step.id, status)}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className={`text-sm ${getStepTextColor(status)}`}>
                          Step {step.id}
                        </p>
                        <p className={`text-sm ${getStepTextColor(status)}`}>
                          {step.name}
                        </p>
                      </div>
                    </Button>
                    
                    {/* Connector line */}
                    {index < visibleSteps.length - 1 && (
                      <div className="flex-1 mx-4">
                        <div
                          className="h-0.5"
                          style={{
                            backgroundColor: step.id < currentStep ? '#F6CF62' : '#A6A3A3'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      {/* Mobile stepper */}
      <div className="lg:hidden">
        <div className="flex items-center justify-center space-x-4">
          {visibleSteps.map((step) => {
            const status = getStepStatus(step.id)
            const isClickable = canNavigateToStep(step.id)
            
            return (
              <Button
                key={step.id}
                variant="ghost"
                size="sm"
                onClick={() => handleStepClick(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
                  isClickable ? 'hover:bg-gray-50' : 'cursor-not-allowed'
                }`}
              >
                {getStepIcon(step.id, status)}
                <span className={`text-xs ${getStepTextColor(status)}`}>
                  {step.id}
                </span>
              </Button>
            )
          })}
        </div>
        
        {/* Current step name */}
        <div className="text-center mt-4">
          <h2 className="text-lg font-medium text-gray-900">
            {visibleSteps.find(s => s.id === currentStep)?.name}
          </h2>
        </div>
      </div>

    </div>
  )
}