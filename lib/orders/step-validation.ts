import { approvalMatchesQuote, isFinalOrderQuote, isPaymentForQuote } from './quote-state'
import { ORDER_STEPS, type OrderState, type StepValidation } from '../../types/orders'

export function validateOrderStep(state: OrderState): StepValidation {
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
        if (!(state.addressValidation ?? state.accuzipValidation)) {
          errors.push('Address validation is required')
        } else if ((state.addressValidation ?? state.accuzipValidation)!.deliverableRecords === 0) {
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
        if (state.quotePending) errors.push('Wait for the current quote')
        if (state.proofPending || !state.proofQuoteRevision || state.proofQuoteRevision !== state.pricing?.quoteRevision) errors.push('Review the proof matching the current final quote')
        if (!isFinalOrderQuote(state.pricing)) errors.push('Save the artwork and obtain a final server quote before approval')
        else if (!approvalMatchesQuote(state.approval, state.pricing)) errors.push('Review and approve the current quoted artwork')
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
        if (state.quotePending) errors.push('Wait for the current quote')
        if (state.proofPending || !state.proofQuoteRevision || state.proofQuoteRevision !== state.pricing?.quoteRevision) errors.push('Review the proof matching the current final quote')
        if (!approvalMatchesQuote(state.approval, state.pricing)) errors.push('Approve the current final quote before payment')
        if (!isPaymentForQuote(state.payment, state.pricing)) errors.push('Payment must match the current final quote')
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

}
