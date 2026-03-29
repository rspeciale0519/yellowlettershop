import { createServiceClient } from '@/utils/supabase/service';
import { logAdminAction } from './audit-logger';
import type { AdminOrderFilters } from './types';

interface OrderListResult {
  orders: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

export async function listOrders(filters: AdminOrderFilters): Promise<OrderListResult> {
  const supabase = createServiceClient();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('orders')
    .select('*, user_profiles!inner(full_name, email)', { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const sortBy = filters.sortBy ?? 'created_at';
  const ascending = filters.sortOrder === 'asc';
  query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list orders: ${error.message}`);

  return { orders: data ?? [], total: count ?? 0, page, limit };
}

export async function getOrderDetail(orderId: string): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  const [orderRes, paymentsRes, auditRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase.from('payment_transactions').select('*')
      .eq('campaign_id', orderId).order('created_at', { ascending: false }),
    supabase.from('admin_audit_log').select('*')
      .eq('target_id', orderId).eq('target_type', 'order')
      .order('created_at', { ascending: false }).limit(20),
  ]);

  if (orderRes.error) throw new Error(`Order not found: ${orderRes.error.message}`);

  // Get user profile for this order
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, email, user_id')
    .eq('user_id', orderRes.data.user_id)
    .single();

  return {
    order: orderRes.data,
    user: profile,
    payments: paymentsRes.data ?? [],
    timeline: auditRes.data ?? [],
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  actorId: string,
  notes?: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(`Failed to update order: ${error.message}`);

  await logAdminAction({
    actorId,
    action: 'order_status_changed',
    targetType: 'order',
    targetId: orderId,
    oldValue: { status: existing?.status },
    newValue: { status, notes },
  });
}

export async function captureOrderPayment(
  orderId: string,
  paymentIntentId: string,
  actorId: string
): Promise<void> {
  // Reuse the existing PaymentIntentService
  const { PaymentIntentService } = await import('@/lib/payments/payment-intent-service');
  const service = new PaymentIntentService();

  await service.capturePayment(paymentIntentId);

  const supabase = createServiceClient();
  await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId);
  await supabase.from('payment_transactions')
    .update({ status: 'captured', captured_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', paymentIntentId);

  await logAdminAction({
    actorId,
    action: 'order_payment_captured',
    targetType: 'order',
    targetId: orderId,
    newValue: { paymentIntentId },
  });
}

export async function refundOrder(
  orderId: string,
  paymentIntentId: string,
  amount: number | undefined,
  reason: string,
  actorId: string
): Promise<void> {
  const { PaymentIntentService } = await import('@/lib/payments/payment-intent-service');
  const service = new PaymentIntentService();

  await service.refundPayment(paymentIntentId, amount, reason as 'duplicate' | 'fraudulent' | 'requested_by_customer');

  const supabase = createServiceClient();
  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);

  await logAdminAction({
    actorId,
    action: 'order_refunded',
    targetType: 'order',
    targetId: orderId,
    newValue: { paymentIntentId, amount, reason },
  });
}

export async function assignVendor(
  orderId: string,
  vendorId: string,
  actorId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('orders')
    .update({
      order_state: supabase.rpc ? undefined : undefined, // vendor stored in order_state JSONB
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  await logAdminAction({
    actorId,
    action: 'order_vendor_assigned',
    targetType: 'order',
    targetId: orderId,
    newValue: { vendorId },
  });
}
