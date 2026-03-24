// Order workflow type definitions
import { ColumnMappingData } from '@/components/shared/column-mapping'

export interface ListDataSelection {
  useMailingData: boolean
  dataSource?: 'upload' | 'mlm_select' | 'manual_entry' | 'melissa_data'
  uploadedFile?: File
  selectedListId?: string
  selectedRecords?: string[]
  manualRecords?: ManualRecord[]
  melissaDataCriteria?: MelissaDataCriteria
}

export interface ManualRecord {
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  zip_code: string
  email?: string
  phone?: string
  company?: string
}

export interface MelissaDataCriteria {
  geography: {
    states: string[]
    counties?: string[]
    cities?: string[]
    zipCodes?: string[]
    radius?: { lat: number, lng: number, miles: number }
  }
  demographics?: {
    ageRange?: { min: number, max: number }
    incomeRange?: { min: number, max: number }
    homeOwnership?: 'owner' | 'renter' | 'both'
    maritalStatus?: string[]
  }
  property?: {
    valueRange?: { min: number, max: number }
    propertyType?: string[]
    yearBuiltRange?: { min: number, max: number }
    sqftRange?: { min: number, max: number }
  }
}

export interface ValidationResults {
  totalRecords: number
  deliverableRecords: number
  undeliverableRecords: number
  validationReport: ValidationRecord[]
  orderId: string
  validatedAt: Date
}

export interface ValidationRecord {
  originalId: string
  isDeliverable: boolean
  standardizedAddress?: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    zip_code: string
  }
  validationNotes?: string
}

export interface ContactCardSelection {
  contactCardId: string
  contactCardData: ContactCard
}

export interface ContactCard {
  id: string
  firstName: string
  lastName: string
  company?: string
  address: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    zip_code: string
  }
  email: string
  phone: string
  isDefault: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface MailingOptionsConfig {
  serviceLevel: 'full_service' | 'ship_processed' | 'print_only'
  postageType?: 'first_class_forever' | 'first_class_discounted' | 'standard'
  includePostage: boolean
  mailPieceFormat?: 'postcard_4x6' | 'postcard_5x7' | 'letter_8_5x11' | 'letter_folded'
  paperStock?: 'standard_14pt' | 'premium_16pt' | 'luxury_18pt'
  finish?: 'matte' | 'gloss' | 'uv_coating'
  shippingAddress?: {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    zip_code: string
  }
}

export interface CampaignConfig {
  isSplitCampaign: boolean
  splitConfig?: {
    numberOfDrops: number
    intervalWeeks: number
  }
  isRepeating: boolean
  repeatConfig?: {
    frequency: 'weekly' | 'monthly' | 'quarterly'
    repetitions: number
  }
  scheduledStartDate?: Date
}

export interface FPDDesignData {
  designId: string
  designJson: any // FPD design state
  previewUrl?: string
  variablesUsed: string[]
  templateId?: string
  isCustomDesign: boolean
}

export interface PricingBreakdown {
  basePrice: number
  addOnServices: AddOnService[]
  postageCharges: number
  shippingCharges: number
  taxAmount: number
  totalPrice: number
  pricePerPiece: number
}

export interface AddOnService {
  id: string
  name: string
  description: string
  unitPrice: number
  quantity: number
  totalPrice: number
}

export interface OrderApproval {
  designLocked: boolean
  termsAccepted: boolean
  noRefundAcknowledged: boolean
  privacyPolicyAccepted: boolean
  approvedAt?: Date
  approvedBy: string
}

export interface PaymentData {
  paymentIntentId?: string
  paymentMethodId?: string
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled'
  amount: number
  currency: string
  authorizedAt?: Date
  capturedAt?: Date
}

export interface OrderState {
  // Workflow progress
  step: number
  totalSteps: number
  currentStepValid: boolean

  // Core workflow data (consolidated structure)
  dataAndMapping?: {
    listData: ListDataSelection
    columnMapping?: ColumnMappingData
  }
  addressValidation?: ValidationResults
  designAndContent?: {
    contactCard?: ContactCardSelection
    design?: FPDDesignData
  }
  campaignSettings?: {
    mailingOptions?: MailingOptionsConfig
    campaignOptions?: CampaignConfig
  }

  // Legacy support (for backward compatibility during transition)
  listData?: ListDataSelection
  columnMapping?: ColumnMappingData
  accuzipValidation?: ValidationResults
  contactCard?: ContactCardSelection
  design?: FPDDesignData
  mailingOptions?: MailingOptionsConfig
  campaignOptions?: CampaignConfig
  
  // Order metadata
  orderId?: string
  isDraft: boolean
  entryPoint: OrderEntryPoint
  lastSaved?: Date
  expiresAt?: Date
  
  // Pricing and validation
  pricing?: PricingBreakdown
  validationErrors: Record<string, string[]>
  
  // Final approval and payment
  approval?: OrderApproval
  payment?: PaymentData
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export type OrderEntryPoint = 
  | 'dashboard_create_new'
  | 'template_gallery'
  | 'mailing_list_manager'
  | 'list_builder'
  | 'previous_orders_reorder'
  | 'quick_order'
  | 'design_tool_save'

export interface OrderStepProps {
  orderState: OrderState
  onUpdateState: (updates: Partial<OrderState>) => void
  onNext: () => void
  onBack: () => void
  onSaveDraft: () => void
  validation: StepValidation
}

export interface StepValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  canProceed: boolean
  requiredFields: string[]
  completedFields: string[]
}

export interface OrderWorkflowContextType {
  orderState: OrderState
  updateOrderState: (updates: Partial<OrderState>) => void
  goToStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  saveDraft: () => Promise<void>
  loadDraft: (draftId: string) => Promise<void>
  validateCurrentStep: () => StepValidation
  submitOrder: () => Promise<{ success: boolean, orderId?: string, error?: string }>
}

// Order workflow step definitions - Consolidated 6-step process
export const ORDER_STEPS = [
  { id: 1, name: 'Data & Mapping', key: 'data_and_mapping', description: 'Select data source and map columns' },
  { id: 2, name: 'Address Validation', key: 'address_validation', description: 'Validate addresses with AccuZip' },
  { id: 3, name: 'Design & Content', key: 'design_and_content', description: 'Choose contact card and customize design' },
  { id: 4, name: 'Campaign Settings', key: 'campaign_settings', description: 'Configure mailing options and campaign setup' },
  { id: 5, name: 'Review & Approval', key: 'review', description: 'Final review before payment' },
  { id: 6, name: 'Payment', key: 'payment', description: 'Process payment and submit order' }
] as const

export type OrderStepKey = typeof ORDER_STEPS[number]['key']

// Utility functions
export function getStepByKey(key: OrderStepKey) {
  return ORDER_STEPS.find(step => step.key === key)
}

export function getStepById(id: number) {
  return ORDER_STEPS.find(step => step.id === id)
}

export function isStepRequired(stepKey: OrderStepKey, orderState: OrderState): boolean {
  switch (stepKey) {
    case 'address_validation':
      // Address validation required if using mailing data
      return orderState.dataAndMapping?.listData.useMailingData ??
             orderState.listData?.useMailingData ?? true
    case 'campaign_settings':
      // Campaign settings always required for configuration
      return true
    default:
      return true
  }
}