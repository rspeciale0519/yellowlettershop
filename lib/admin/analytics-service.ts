import { createServiceClient } from '@/utils/supabase/service';
import {
  netRevenue,
  revenueByDay,
  topCustomerTotals,
  type RevenueOrderRow,
} from './analytics-core';

/**
 * Columns backing every revenue figure (payment state is inline on orders).
 * NOTE: `orders` has NO updated_at column — selecting one makes PostgREST
 * reject the whole query and silently zeroes every metric (caught in review).
 */
const REVENUE_COLUMNS = 'amount_captured, amount_refunded, captured_at, created_at, created_by';

/** Capture-time used for windowing, mirroring analytics-core's fallback order. */
function capturedAt(row: RevenueOrderRow): string {
  return row.captured_at ?? row.created_at ?? '';
}

function inWindow(row: RevenueOrderRow, from: string, to?: string): boolean {
  const at = capturedAt(row);
  return !!at && at >= from && (!to || at <= to);
}

export interface AnalyticsMetrics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    newThisMonth: number;
    newLastMonth: number;
    changePercent: number;
  };
  averageOrderValue: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopCustomer {
  userId: string;
  fullName: string | null;
  email: string | null;
  orderCount: number;
  totalSpent: number;
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const supabase = createServiceClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    capturedOrders,
    allOrders,
    thisMonthOrders,
    lastMonthOrders,
    allUsers,
    newUsersThisMonth,
    newUsersLastMonth,
  ] = await Promise.all([
    // One pass over captured orders; the three revenue windows are derived in
    // memory below (payment state is inline — there is no transactions table).
    supabase.from('orders').select(REVENUE_COLUMNS).not('amount_captured', 'is', null),
    supabase.from('orders').select('status', { count: 'exact' }),
    supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', thisMonthStart),
    supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('user_profiles').select('id', { count: 'exact' }),
    supabase.from('user_profiles').select('id', { count: 'exact' }).gte('created_at', thisMonthStart),
    supabase.from('user_profiles').select('id', { count: 'exact' }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
  ]);

  // Surface query failures — a silent [] here reports $0 revenue to admins.
  if (capturedOrders.error) {
    throw new Error(`Failed to load revenue rows: ${capturedOrders.error.message}`);
  }
  const revenueRows = (capturedOrders.data ?? []) as unknown as RevenueOrderRow[];

  const totalRevenue = netRevenue(revenueRows);
  const thisMonthRevenue = netRevenue(revenueRows.filter((r) => inWindow(r, thisMonthStart)));
  const lastMonthRevenue = netRevenue(
    revenueRows.filter((r) => inWindow(r, lastMonthStart, lastMonthEnd))
  );

  const thisMonthOrderCount = thisMonthOrders.count ?? 0;
  const lastMonthOrderCount = lastMonthOrders.count ?? 0;
  const totalOrderCount = allOrders.count ?? 0;

  const newThisMonth = newUsersThisMonth.count ?? 0;
  const newLastMonth = newUsersLastMonth.count ?? 0;

  // Count orders by status
  const byStatus: Record<string, number> = {};
  for (const o of (allOrders.data ?? []) as { status: string }[]) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }

  return {
    revenue: {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      changePercent: calcChange(thisMonthRevenue, lastMonthRevenue),
    },
    orders: {
      total: totalOrderCount,
      thisMonth: thisMonthOrderCount,
      lastMonth: lastMonthOrderCount,
      changePercent: calcChange(thisMonthOrderCount, lastMonthOrderCount),
      byStatus,
    },
    users: {
      total: allUsers.count ?? 0,
      newThisMonth,
      newLastMonth,
      changePercent: calcChange(newThisMonth, newLastMonth),
    },
    averageOrderValue: totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0,
  };
}

export async function getRevenueTimeline(days = 30): Promise<RevenueDataPoint[]> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select(REVENUE_COLUMNS)
    .not('amount_captured', 'is', null);
  if (error) throw new Error(`Failed to load revenue timeline: ${error.message}`);

  // Window in memory: captured_at is null on legacy rows, so the fallback chain
  // in analytics-core (captured_at → updated_at → created_at) decides the date.
  const sinceDate = since.slice(0, 10);
  const grouped: Record<string, { revenue: number; orders: number }> = {};
  for (const day of revenueByDay((data ?? []) as unknown as RevenueOrderRow[])) {
    if (day.date >= sinceDate) grouped[day.date] = { revenue: day.revenue, orders: day.orders };
  }

  // Fill missing days
  const result: RevenueDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    result.push({
      date,
      revenue: grouped[date]?.revenue ?? 0,
      orders: grouped[date]?.orders ?? 0,
    });
  }

  return result;
}

export async function getTopCustomers(limit = 10): Promise<TopCustomer[]> {
  const supabase = createServiceClient();

  // Captured orders grouped by their owner (orders.created_by).
  const { data: capturedOrders, error } = await supabase
    .from('orders')
    .select(REVENUE_COLUMNS)
    .not('amount_captured', 'is', null);
  if (error) throw new Error(`Failed to load top customers: ${error.message}`);

  const sorted = topCustomerTotals(
    (capturedOrders ?? []) as unknown as RevenueOrderRow[]
  ).slice(0, limit);

  if (sorted.length === 0) return [];

  // Fetch profiles
  const userIds = sorted.map((s) => s.userId);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email')
    .in('user_id', userIds);

  type ProfileRow = { user_id: string; full_name: string | null; email: string | null };
  const profileMap = new Map(
    ((profiles ?? []) as unknown as ProfileRow[]).map((p) => [p.user_id, p])
  );

  return sorted.map((stats) => {
    const profile = profileMap.get(stats.userId);
    return {
      userId: stats.userId,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      orderCount: stats.orderCount,
      totalSpent: stats.total,
    };
  });
}
