import { createServiceClient } from '@/utils/supabase/service';
import { logAdminAction } from './audit-logger';
import type { AdminOrderFilters } from './types';

interface OrderListResult {
  orders: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

/**
 * The admin detail view wants a list of payments, but payment state lives
 * inline on the order (there is no payment_transactions table). Derive the
 * single logical payment from the order's own columns.
 *
 * Pure — keep it that way so it stays unit-testable.
 */
export function inlinePayments(order: Record<string, unknown>): Record<string, unknown>[] {
  if (!order?.stripe_payment_intent_id) return [];
  return [
    {
      stripe_payment_intent_id: order.stripe_payment_intent_id,
      status: order.payment_status ?? null,
      amount: order.total_cost ?? null,
      amount_captured: order.amount_captured ?? null,
      amount_refunded: order.amount_refunded ?? null,
      captured_at: order.captured_at ?? null,
      refunded_at: order.refunded_at ?? null,
    },
  ];
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

/** Batch-load owner profiles for a page of orders (no FK join path exists). */
async function attachOwnerProfiles(
  supabase: ReturnType<typeof createServiceClient>,
  orders: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const ownerIds = [...new Set(orders.map((o) => o.created_by).filter(Boolean))] as string[];
  if (ownerIds.length === 0) return orders;

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email')
    .in('user_id', ownerIds);

  const byId = new Map(
    ((profiles ?? []) as unknown as ProfileRow[]).map((p) => [p.user_id, p])
  );

  // Keep the `user_profiles` key the admin UI already reads.
  return orders.map((o) => ({
    ...o,
    user_profiles: byId.get(o.created_by as string) ?? null,
  }));
}

export async function listOrders(filters: AdminOrderFilters): Promise<OrderListResult> {
  const supabase = createServiceClient();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const offset = (page - 1) * limit;

  let query = supabase.from('orders').select('*', { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.userId) {
    query = query.eq('created_by', filters.userId);
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

  const orders = await attachOwnerProfiles(
    supabase,
    (data ?? []) as unknown as Record<string, unknown>[]
  );

  return { orders, total: count ?? 0, page, limit };
}

export async function getOrderDetail(orderId: string): Promise<Record<string, unknown>> {
  const supabase = createServiceClient();

  const [orderRes, auditRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase
      .from('admin_audit_log')
      .select('*')
      .eq('target_id', orderId)
      .eq('target_type', 'order')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (orderRes.error) throw new Error(`Order not found: ${orderRes.error.message}`);

  const order = orderRes.data as unknown as Record<string, unknown>;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, email, user_id')
    .eq('user_id', order.created_by as string)
    .single();

  return {
    order,
    user: profile,
    payments: inlinePayments(order),
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
  // PaymentIntentService.capturePayment persists payment_status/amount_captured/
  // captured_at inline on the order; this only advances the fulfillment status.
  const { PaymentIntentService } = await import('@/lib/payments/payment-intent-service');
  const service = new PaymentIntentService();

  await service.capturePayment({ paymentIntentId });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw new Error(`Failed to advance order after capture: ${error.message}`);

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
  // refundPayment persists payment_status/amount_refunded/refunded_at inline.
  const { PaymentIntentService } = await import('@/lib/payments/payment-intent-service');
  const service = new PaymentIntentService();

  await service.refundPayment({ paymentIntentId, amount, reason });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw new Error(`Failed to cancel order after refund: ${error.message}`);

  await logAdminAction({
    actorId,
    action: 'order_refunded',
    targetType: 'order',
    targetId: orderId,
    newValue: { paymentIntentId, amount, reason },
  });
}
