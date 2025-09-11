/**
 * Payment System Export Index
 * 
 * Central export point for all payment-related modules.
 * Provides easy imports for payment functionality throughout the application.
 */

// Configuration and Setup
export { 
  stripe, 
  getStripe, 
  STRIPE_CONFIG, 
  SUBSCRIPTION_PLANS,
  USAGE_PRICING,
  type SubscriptionPlanKey,
  type UsagePricingKey
} from './stripe-config';

// Core Services
export { 
  PaymentService, 
  PaymentServiceError,
  type PaymentIntent,
  type PaymentMethodData
} from './payment-service';

export { 
  SubscriptionService,
  type CreateSubscriptionParams,
  type SubscriptionDetails
} from './subscription-service';

// Audit Logging
export {
  PaymentAuditLogger,
  paymentAuditLogger,
  type PaymentAuditEventType,
  type PaymentAuditLogEntry
} from './payment-audit-logger';

// Re-export types from other modules that might be used
export type { 
  PaymentStatus, 
  SubscriptionPlan, 
  SubscriptionStatus 
} from '@/types/supabase-comprehensive';