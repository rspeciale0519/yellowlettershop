"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { OrderProvider } from '@/components/orders/OrderProvider'
import { OrderStepper } from '@/components/orders/OrderStepper'
import { OrderNavigation } from '@/components/orders/OrderNavigation'
import { DataAndMappingStep } from '@/components/orders/steps/DataAndMappingStep'
import { AddressValidationStep } from '@/components/orders/steps/AddressValidationStep'
import { DesignAndContentStep } from '@/components/orders/steps/DesignAndContentStep'
import { CampaignSettingsStep } from '@/components/orders/steps/CampaignSettingsStep'
import { ReviewApprovalStep } from '@/components/orders/steps/ReviewApprovalStep'
import { PaymentStep } from '@/components/orders/steps/PaymentStep'
import { ORDER_STEPS, OrderEntryPoint, OrderState } from '@/types/orders'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useOrderWorkflow } from '@/components/orders/OrderProvider'

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <NewOrderPageInner />
    </Suspense>
  )
}

function NewOrderPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine entry point from URL parameters
  const getEntryPoint = (): OrderEntryPoint => {
    const source = searchParams.get('source')
    const templateId = searchParams.get('templateId')
    const listId = searchParams.get('listId')
    const reorderId = searchParams.get('reorderId')

    if (reorderId) return 'previous_orders_reorder'
    if (templateId) return 'template_gallery'
    if (listId) return 'mailing_list_manager'
    if (source === 'list_builder') return 'list_builder'
    if (source === 'quick_order') return 'quick_order'
    if (source === 'design_tool') return 'design_tool_save'
    
    return 'dashboard_create_new'
  }

  // Initialize order state based on entry point
  const initializeOrderState = (): Partial<OrderState> => {
    const entryPoint = getEntryPoint()
    const templateId = searchParams.get('templateId')
    const listId = searchParams.get('listId')
    const reorderId = searchParams.get('reorderId')

    const baseState: Partial<OrderState> = {
      step: 1,
      totalSteps: 6, // Updated for 6-step process
      entryPoint,
      isDraft: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataAndMapping: {
        listData: {
          useMailingData: true // Default to using mailing data
        }
      },
      // Legacy support
      listData: {
        useMailingData: true
      },
      validationErrors: {}
    }

    // Customize based on entry point
    switch (entryPoint) {
      case 'template_gallery':
        if (templateId) {
          baseState.designAndContent = {
            design: {
              designId: '',
              templateId,
              designJson: null,
              variablesUsed: [],
              isCustomDesign: false
            }
          }
          // Legacy support
          baseState.design = {
            designId: '',
            templateId,
            designJson: null,
            variablesUsed: [],
            isCustomDesign: false
          }
        }
        break

      case 'mailing_list_manager':
        if (listId) {
          baseState.dataAndMapping = {
            listData: {
              useMailingData: true,
              dataSource: 'mlm_select',
              selectedListId: listId
            }
          }
          // Legacy support
          baseState.listData = {
            useMailingData: true,
            dataSource: 'mlm_select',
            selectedListId: listId
          }
          baseState.step = 1 // Start with data and mapping step
        }
        break

      case 'list_builder':
        baseState.dataAndMapping = {
          listData: {
            useMailingData: true,
            dataSource: 'melissa_data'
          }
        }
        // Legacy support
        baseState.listData = {
          useMailingData: true,
          dataSource: 'melissa_data'
        }
        break

      case 'quick_order':
        baseState.dataAndMapping = {
          listData: {
            useMailingData: true,
            dataSource: 'manual_entry',
            manualRecords: []
          }
        }
        // Legacy support
        baseState.listData = {
          useMailingData: true,
          dataSource: 'manual_entry',
          manualRecords: []
        }
        break

      case 'previous_orders_reorder':
        if (reorderId) {
          // Load previous order data - this would be handled by the OrderProvider
          baseState.step = 1 // Start with data and mapping step for reorders
        }
        break
    }

    return baseState
  }


  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your order...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex space-x-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <OrderProvider initialState={initializeOrderState()}>
      {(orderState) => (
        <OrderContent orderState={orderState} router={router} />
      )}
    </OrderProvider>
  )
}

function OrderContent({ orderState, router }: { orderState: OrderState, router: any }) {
  const { updateOrderState, validateCurrentStep, nextStep, previousStep, saveDraft } = useOrderWorkflow()

  const renderCurrentStep = (step: number, orderState: OrderState) => {
    const stepConfig = ORDER_STEPS.find(s => s.id === step)
    if (!stepConfig) return null

    const commonProps = {
      orderState,
      onUpdateState: updateOrderState,
      onNext: nextStep,
      onBack: previousStep,
      onSaveDraft: saveDraft,
      validation: validateCurrentStep()
    }

    switch (stepConfig.key) {
      case 'data_and_mapping':
        return <DataAndMappingStep {...commonProps} />
      case 'address_validation':
        return <AddressValidationStep {...commonProps} />
      case 'design_and_content':
        return <DesignAndContentStep {...commonProps} />
      case 'campaign_settings':
        return <CampaignSettingsStep {...commonProps} />
      case 'review':
        return <ReviewApprovalStep {...commonProps} />
      case 'payment':
        return <PaymentStep {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Create New Order</h1>
                <p className="text-gray-600">
                  {orderState.entryPoint === 'template_gallery' && 'Using selected template'}
                  {orderState.entryPoint === 'mailing_list_manager' && 'Using selected mailing list'}
                  {orderState.entryPoint === 'list_builder' && 'Building targeted list'}
                  {orderState.entryPoint === 'previous_orders_reorder' && 'Reordering previous campaign'}
                  {orderState.entryPoint === 'quick_order' && 'Single mail piece'}
                  {orderState.entryPoint === 'dashboard_create_new' && 'Complete order workflow'}
                </p>
              </div>
            </div>

            {orderState.isDraft && (
              <div className="text-sm text-gray-500">
                Draft saved {orderState.lastSaved ? new Date(orderState.lastSaved).toLocaleTimeString() : 'never'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <OrderStepper
            currentStep={orderState.step}
            orderState={orderState}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentStep(orderState.step, orderState)}
      </div>

      {/* Main Navigation */}
      <div className="bg-white border-t border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <OrderNavigation orderState={orderState} />
        </div>
      </div>
    </div>
  )
}