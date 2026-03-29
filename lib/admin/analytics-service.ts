import { createServiceClient } from '@/utils/supabase/service';

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
    allPayments,
    thisMonthPayments,
    lastMonthPayments,
    allOrders,
    thisMonthOrders,
    lastMonthOrders,
    allUsers,
    newUsersThisMonth,
    newUsersLastMonth,
  ] = await Promise.all([
    supabase.from('payment_transactions').select('amount').eq('status', 'captured'),
    supabase.from('payment_transactions').select('amount').eq('status', 'captured').gte('captured_at', thisMonthStart),
    supabase.from('payment_transactions').select('amount').eq('status', 'captured').gte('captured_at', lastMonthStart).lte('captured_at', lastMonthEnd),
    supabase.from('orders').select('status', { count: 'exact' }),
    supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', thisMonthStart),
    supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('user_profiles').select('id', { count: 'exact' }),
    supabase.from('user_profiles').select('id', { count: 'exact' }).gte('created_at', thisMonthStart),
    supabase.from('user_profiles').select('id', { count: 'exact' }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
  ]);

  const sumAmounts = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0) / 100;

  const totalRevenue = sumAmounts(allPayments.data as { amount: number }[] | null);
  const thisMonthRevenue = sumAmounts(thisMonthPayments.data as { amount: number }[] | null);
  const lastMonthRevenue = sumAmounts(lastMonthPayments.data as { amount: number }[] | null);

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

  const { data } = await supabase
    .from('payment_transactions')
    .select('amount, captured_at')
    .eq('status', 'captured')
    .gte('captured_at', since)
    .order('captured_at', { ascending: true });

  // Group by date
  const grouped: Record<string, { revenue: number; orders: number }> = {};
  for (const row of (data ?? []) as { amount: number; captured_at: string }[]) {
    const date = row.captured_at.slice(0, 10);
    if (!grouped[date]) grouped[date] = { revenue: 0, orders: 0 };
    grouped[date].revenue += Number(row.amount) / 100;
    grouped[date].orders += 1;
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

  // Get captured payments grouped by user
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('user_id, amount')
    .eq('status', 'captured');

  if (!payments || payments.length === 0) return [];

  // Aggregate by user
  const userTotals: Record<string, { total: number; count: number }> = {};
  for (const p of payments as { user_id: string; amount: number }[]) {
    if (!userTotals[p.user_id]) userTotals[p.user_id] = { total: 0, count: 0 };
    userTotals[p.user_id].total += Number(p.amount) / 100;
    userTotals[p.user_id].count += 1;
  }

  // Sort by total spent and take top N
  const sorted = Object.entries(userTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit);

  // Fetch profiles
  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, email')
    .in('user_id', userIds);

  const profileMap = new Map((profiles ?? []).map((p: { user_id: string; full_name: string | null; email: string | null }) => [p.user_id, p]));

  return sorted.map(([userId, stats]) => {
    const profile = profileMap.get(userId);
    return {
      userId,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      orderCount: stats.count,
      totalSpent: stats.total,
    };
  });
}
