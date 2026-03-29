import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { getRevenueTimeline } from '@/lib/admin/analytics-service';
import type { AdminUser } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 365);

  const timeline = await getRevenueTimeline(days);
  return NextResponse.json({ data: timeline });
});
