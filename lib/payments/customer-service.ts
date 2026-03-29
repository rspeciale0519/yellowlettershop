/**
 * Customer Management Service
 * Handles Stripe customer creation and management
 */

import Stripe from 'stripe';
import { stripe, requireStripe } from './stripe-config';
import { createServiceClient } from '@/utils/supabase/service';
import { PaymentServiceError } from './types';

export class CustomerService {
  private supabase = createServiceClient();

  /**
   * Ensure customer exists in Stripe and database
   */
  async ensureCustomer(userId: string, userEmail?: string): Promise<string> {
    requireStripe();

    // Check if customer already exists
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new PaymentServiceError(
        'Failed to retrieve user profile',
        'PROFILE_NOT_FOUND',
        404,
        profileError
      );
    }

    if (profile.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Get user email if not provided
    let email = userEmail;
    if (!email) {
      const { data: authUser, error: authError } = await this.supabase.auth.admin.getUserById(userId);
      if (authError || !authUser.user?.email) {
        throw new PaymentServiceError(
          'Failed to retrieve user email',
          'EMAIL_RETRIEVAL_ERROR',
          500,
          authError
        );
      }
      email = authUser.user.email;
    }

    try {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: profile.full_name || undefined,
        metadata: {
          userId,
          source: 'yellowlettershop',
        },
      });

      // Update user profile with customer ID
      const { error: updateError } = await this.supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', userId);

      if (updateError) {
        throw new PaymentServiceError(
          'Failed to update user profile with customer ID',
          'PROFILE_UPDATE_ERROR',
          500,
          updateError
        );
      }

      return customer.id;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Stripe customer creation failed',
          'STRIPE_CUSTOMER_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get customer details from Stripe
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    requireStripe();

    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new PaymentServiceError(
          'Customer has been deleted',
          'CUSTOMER_DELETED',
          404
        );
      }
      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to retrieve customer',
          'STRIPE_CUSTOMER_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Update customer information
   */
  async updateCustomer(
    customerId: string,
    updates: {
      email?: string;
      name?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<Stripe.Customer> {
    requireStripe();

    try {
      return await stripe.customers.update(customerId, updates);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to update customer',
          'STRIPE_CUSTOMER_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }
}