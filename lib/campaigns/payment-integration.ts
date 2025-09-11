/**
 * Campaign Payment Integration
 * 
 * Integrates campaign workflow with the payment system.
 * Handles payment authorization, pricing calculation, and order processing.
 */

import { createClient } from '@/utils/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { paymentAuditLogger } from '@/lib/payments/payment-audit-logger';
import type { 
  PaymentStatus,
  CampaignStatus,
  FulfillmentType,
  PostageType,
  DesignType
} from '@/types/supabase-comprehensive';

export interface CampaignPaymentParams {
  campaignId: string;
  userId: string;
  mailPieceCount: number;
  designServiceType?: 'basic' | 'custom' | 'premium';
  addressValidationCount?: number;
  dataEnrichmentServices?: Array<'skipTracing' | 'propertyData' | 'contactData'>;
  fulfillmentType: FulfillmentType;
  postageType: PostageType;
  designType: DesignType;
}

export interface CampaignOrderData {
  campaignId: string;
  paymentIntentId: string;
  totalCost: number;
  breakdown: Record<string, number>;
  status: CampaignStatus;
}

/**
 * Campaign Payment Integration Service
 */
export class CampaignPaymentService {
  private supabase = createClient();
  private paymentService = new PaymentService();

  /**
   * Calculate pricing for a campaign and create payment intent
   */
  async initiateCampaignPayment(params: CampaignPaymentParams): Promise<{
    paymentIntent: any;
    pricing: any;
    campaignOrder: CampaignOrderData;
  }> {
    const {
      campaignId,
      userId,
      mailPieceCount,
      designServiceType,
      addressValidationCount = 0,
      dataEnrichmentServices = [],
      fulfillmentType,
      postageType,
      designType,
    } = params;

    // Get user profile for pricing calculation
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Calculate pricing
    const pricing = this.paymentService.calculateCampaignPricing({
      mailPieceCount,
      designServiceType,
      addressValidationCount,
      dataEnrichmentServices,
      userPlan: profile.subscription_plan,
    });

    // Add fulfillment and postage adjustments
    const adjustedPricing = this.addFulfillmentCosts(pricing, {
      fulfillmentType,
      postageType,
      designType,
      mailPieceCount,
    });

    // Create payment intent
    const paymentIntent = await this.paymentService.createPaymentIntent({
      userId,
      amount: Math.round(adjustedPricing.totalCost * 100), // Convert to cents
      description: `Campaign Order - ${mailPieceCount} mail pieces`,
      campaignId,
      metadata: {
        mail_piece_count: mailPieceCount.toString(),
        fulfillment_type: fulfillmentType,
        postage_type: postageType,
        design_type: designType,
        design_service: designServiceType || 'none',
      },
    });

    // Update campaign status
    await this.updateCampaignStatus(campaignId, userId, 'pending_payment');

    // Create order record
    const campaignOrder = await this.createCampaignOrder({
      campaignId,
      userId,
      paymentIntentId: paymentIntent.id,
      totalCost: adjustedPricing.totalCost,
      breakdown: adjustedPricing.breakdown,
      mailPieceCount,
      fulfillmentType,
      postageType,
      designType,
    });

    // Log the transaction
    await paymentAuditLogger.logPaymentIntentCreated({
      userId,
      paymentIntentId: paymentIntent.id,
      amount: Math.round(adjustedPricing.totalCost * 100),
      currency: 'usd',
      description: `Campaign Order - ${mailPieceCount} mail pieces`,
      campaignId,
      metadata: {
        total_cost: adjustedPricing.totalCost,
        breakdown: adjustedPricing.breakdown,
        fulfillment_type: fulfillmentType,
      },
    });

    return {
      paymentIntent,
      pricing: adjustedPricing,
      campaignOrder,
    };
  }

  /**
   * Process payment authorization confirmation
   */
  async confirmCampaignPayment(params: {
    campaignId: string;
    userId: string;
    paymentIntentId: string;
  }): Promise<void> {
    const { campaignId, userId, paymentIntentId } = params;

    // Verify the payment transaction exists and belongs to the user
    const { data: transaction, error: transactionError } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('user_id', userId)
      .eq('campaign_id', campaignId)
      .single();

    if (transactionError || !transaction) {
      throw new Error('Payment transaction not found or access denied');
    }

    // Update campaign status to paid (authorized but not captured)
    await this.updateCampaignStatus(campaignId, userId, 'paid');

    // Update transaction status
    await this.supabase
      .from('payment_transactions')
      .update({
        status: 'authorized' as PaymentStatus,
        authorized_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    // Log the authorization
    await paymentAuditLogger.logPaymentAuthorized({
      userId,
      paymentIntentId,
      amount: Math.round(transaction.amount * 100),
      currency: 'usd',
      customerId: transaction.metadata?.customerId || '',
    });

    // Trigger campaign processing workflow
    await this.triggerCampaignProcessing(campaignId, userId);
  }

  /**
   * Capture payment when campaign is ready for fulfillment
   */
  async captureCampaignPayment(params: {
    campaignId: string;
    userId: string;
    approvedByUserId?: string;
  }): Promise<void> {
    const { campaignId, userId, approvedByUserId } = params;

    // Get campaign and payment details
    const { data: campaign, error: campaignError } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found or access denied');
    }

    // Get associated payment transaction
    const { data: transaction, error: transactionError } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'authorized')
      .single();

    if (transactionError || !transaction) {
      throw new Error('No authorized payment found for campaign');
    }

    // Capture the payment
    await this.paymentService.capturePayment(transaction.stripe_payment_intent_id);

    // Update campaign status
    await this.updateCampaignStatus(campaignId, userId, 'in_production');

    // Log the capture
    await paymentAuditLogger.logPaymentCaptured({
      userId,
      paymentIntentId: transaction.stripe_payment_intent_id,
      amount: Math.round(transaction.amount * 100),
      currency: 'usd',
    });

    // Create audit log entry
    await this.supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_type: 'campaign_payment_captured',
        metadata: {
          campaign_id: campaignId,
          payment_intent_id: transaction.stripe_payment_intent_id,
          approved_by: approvedByUserId || userId,
          capture_amount: transaction.amount,
        },
      });
  }

  /**
   * Cancel campaign and refund payment
   */
  async cancelCampaignAndRefund(params: {
    campaignId: string;
    userId: string;
    reason: string;
    refundAmount?: number;
  }): Promise<void> {
    const { campaignId, userId, reason, refundAmount } = params;

    // Get payment transaction
    const { data: transaction, error: transactionError } = await this.supabase
      .from('payment_transactions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .in('status', ['authorized', 'captured'])
      .single();

    if (transactionError || !transaction) {
      throw new Error('No refundable payment found for campaign');
    }

    // Only refund if payment was captured
    if (transaction.status === 'captured') {
      await this.paymentService.refundPayment(
        transaction.stripe_payment_intent_id,
        refundAmount ? Math.round(refundAmount * 100) : undefined,
        'requested_by_customer'
      );
    }

    // Update campaign status
    await this.updateCampaignStatus(campaignId, userId, 'cancelled');

    // Log the cancellation
    await this.supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_type: 'campaign_cancelled',
        metadata: {
          campaign_id: campaignId,
          payment_intent_id: transaction.stripe_payment_intent_id,
          cancellation_reason: reason,
          refund_amount: refundAmount || transaction.amount,
          transaction_status: transaction.status,
        },
      });
  }

  /**
   * Private helper methods
   */

  private addFulfillmentCosts(
    basePricing: any,
    options: {
      fulfillmentType: FulfillmentType;
      postageType: PostageType;
      designType: DesignType;
      mailPieceCount: number;
    }
  ) {
    const { fulfillmentType, postageType, designType, mailPieceCount } = options;
    
    let adjustedCost = basePricing.totalCost;
    const adjustedBreakdown = { ...basePricing.breakdown };

    // Add postage costs
    const postageCosts = {
      first_class_forever: 0.68,
      first_class_discounted: 0.55,
      standard_class: 0.42,
    };
    
    const postageCost = postageCosts[postageType] * mailPieceCount;
    adjustedCost += postageCost;
    adjustedBreakdown.postage = postageCost;

    // Add fulfillment fees
    const fulfillmentFees = {
      full_service: 0.15, // Per piece fee
      ship_to_user: 0.10,
      print_only: 0.05,
    };
    
    const fulfillmentCost = fulfillmentFees[fulfillmentType] * mailPieceCount;
    adjustedCost += fulfillmentCost;
    adjustedBreakdown.fulfillment = fulfillmentCost;

    // Add design type surcharges
    const designSurcharges = {
      letter: 0,
      postcard: 0.02, // Per piece
      envelope: 0.05,
      self_mailer: 0.08,
    };
    
    const designSurcharge = designSurcharges[designType] * mailPieceCount;
    if (designSurcharge > 0) {
      adjustedCost += designSurcharge;
      adjustedBreakdown.designSurcharge = designSurcharge;
    }

    return {
      totalCost: Math.round(adjustedCost * 100) / 100,
      breakdown: adjustedBreakdown,
      discountApplied: basePricing.discountApplied,
    };
  }

  private async updateCampaignStatus(
    campaignId: string, 
    userId: string, 
    status: CampaignStatus
  ): Promise<void> {
    const { error } = await this.supabase
      .from('campaigns')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update campaign status:', error);
      throw new Error('Failed to update campaign status');
    }
  }

  private async createCampaignOrder(params: {
    campaignId: string;
    userId: string;
    paymentIntentId: string;
    totalCost: number;
    breakdown: Record<string, number>;
    mailPieceCount: number;
    fulfillmentType: FulfillmentType;
    postageType: PostageType;
    designType: DesignType;
  }): Promise<CampaignOrderData> {
    // This would integrate with an orders table if it exists
    // For now, we'll return the order data structure
    return {
      campaignId: params.campaignId,
      paymentIntentId: params.paymentIntentId,
      totalCost: params.totalCost,
      breakdown: params.breakdown,
      status: 'pending_payment',
    };
  }

  private async triggerCampaignProcessing(
    campaignId: string, 
    userId: string
  ): Promise<void> {
    // This would trigger the campaign processing workflow
    // For example: address validation, list preparation, design finalization
    
    await this.supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_type: 'campaign_processing_started',
        metadata: {
          campaign_id: campaignId,
          processing_stage: 'payment_confirmed',
          next_steps: ['address_validation', 'design_preparation', 'production_queue'],
        },
      });
  }
}

// Export singleton instance
export const campaignPaymentService = new CampaignPaymentService();