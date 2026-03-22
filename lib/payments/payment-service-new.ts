/**
 * Payment Services Entry Point
 * 
 * Provides a unified interface for all payment-related operations
 */

export * from './types';
export * from './customer-service';
export * from './payment-intent-service';
export * from './subscription-service';

// Re-export the main service classes for convenience
import { CustomerService } from './customer-service';
import { PaymentIntentService } from './payment-intent-service';
import { SubscriptionService } from './subscription-service';

export { CustomerService } from './customer-service';
export { PaymentIntentService } from './payment-intent-service';
export { SubscriptionService } from './subscription-service';

/**
 * Main Payment Service - Combines all payment functionality
 */
export class PaymentService {
  public readonly customers = new CustomerService();
  public readonly paymentIntents = new PaymentIntentService();
  public readonly subscriptions = new SubscriptionService();

  // Legacy compatibility methods that delegate to specific services
  async ensureCustomer(userId: string, userEmail?: string): Promise<string> {
    return this.customers.ensureCustomer(userId, userEmail);
  }

  async createPaymentIntent(params: any): Promise<any> {
    return this.paymentIntents.createPaymentIntent(params);
  }

  async capturePayment(params: any): Promise<any> {
    return this.paymentIntents.capturePayment(params);
  }

  async refundPayment(params: any): Promise<any> {
    return this.paymentIntents.refundPayment(params);
  }

  async createSubscription(params: any): Promise<any> {
    return this.subscriptions.createSubscription(params);
  }

  async updateSubscription(params: any): Promise<any> {
    return this.subscriptions.updateSubscription(params);
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<any> {
    return this.subscriptions.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
  }
}

// Default export for backward compatibility
const paymentService = new PaymentService();
export default paymentService;