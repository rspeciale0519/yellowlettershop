import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { getAnalyticsMetrics, getTopCustomers } from '@/lib/admin/analytics-service';
import type { AdminUser } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const [metrics, topCustomers] = await Promise.all([
    getAnalyticsMetrics(),
    getTopCustomers(10),
  ]);

  return NextResponse.json({ data: { metrics, topCustomers } });
});
