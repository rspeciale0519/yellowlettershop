/**
 * Stripe Configuration and Client Setup
 * 
 * This module provides Stripe client configuration for both server and client-side usage.
 * Ensures proper environment variable validation and error handling.
 */

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Environment validation
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey && typeof window === 'undefined') {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

if (!stripePublishableKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is required');
}

/**
 * Server-side Stripe client instance
 * Only available on server-side (Node.js environment)
 */
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia', // Latest API version
      typescript: true,
      telemetry: false, // Disable telemetry for better performance
    })
  : null;

/**
 * Client-side Stripe instance (lazy-loaded)
 * Used for Stripe Elements and client-side payment processing
 */
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey!);
  }
  return stripePromise;
};

/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
  // Standard currency for the platform
  currency: 'usd' as const,
  
  // Manual payment capture workflow as per requirements
  captureMethod: 'manual' as const,
  
  // Payment method types to accept
  paymentMethodTypes: ['card'] as const,
  
  // Subscription billing intervals
  billingIntervals: {
    monthly: 'month' as const,
    yearly: 'year' as const,
  },
  
  // Webhook endpoints
  webhookEndpoint: '/api/payments/webhooks/stripe',
  
  // Application fee for marketplace functionality (if needed)
  applicationFeePercent: 0, // No application fee for direct payments
} as const;

/**
 * Subscription plan configurations
 * Maps internal subscription plans to Stripe price IDs
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    priceId: null, // Free plan has no Stripe price ID
    monthlyPriceId: null,
    yearlyPriceId: null,
    features: ['1 user', 'Limited features'],
    maxUsers: 1,
    maxCampaigns: 5,
    price: {
      monthly: 0,
      yearly: 0,
    },
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    features: ['1 user', 'Full features', 'Priority support'],
    maxUsers: 1,
    maxCampaigns: -1, // Unlimited
    price: {
      monthly: 49,
      yearly: 490, // ~17% discount
    },
  },
  team: {
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    monthlyPriceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
    features: ['3 users', 'Full features', 'Team collaboration', 'Priority support'],
    maxUsers: 3,
    maxCampaigns: -1, // Unlimited
    price: {
      monthly: 99,
      yearly: 990, // ~17% discount
    },
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    features: ['10 users', 'Advanced features', 'White-label', 'Dedicated support'],
    maxUsers: 10,
    maxCampaigns: -1, // Unlimited
    price: {
      monthly: 499,
      yearly: 4990, // ~17% discount
    },
  },
} as const;

/**
 * Usage-based billing configurations
 */
export const USAGE_PRICING = {
  // Address validation pricing (per validation)
  addressValidation: {
    pricePerValidation: 0.05, // $0.05 per address validation
    freeValidationsPerMonth: {
      free: 100,
      pro: 1000,
      team: 5000,
      enterprise: 20000,
    },
  },
  
  // Mail piece pricing (per piece)
  mailPieces: {
    basePrice: 0.85, // Base price per mail piece
    volumeDiscounts: [
      { minQuantity: 1000, discount: 0.05 }, // 5% discount
      { minQuantity: 5000, discount: 0.10 }, // 10% discount
      { minQuantity: 10000, discount: 0.15 }, // 15% discount
    ],
  },
  
  // Design services (per design)
  designServices: {
    basicDesign: 25,
    customDesign: 99,
    premiumDesign: 199,
  },
  
  // Data enrichment (per record)
  dataEnrichment: {
    skipTracing: 0.15, // $0.15 per record
    propertyData: 0.10, // $0.10 per record
    contactData: 0.08, // $0.08 per record
  },
} as const;

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;
export type UsagePricingKey = keyof typeof USAGE_PRICING;