import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { getPricingHistory } from '@/lib/admin/pricing-service';
import type { AdminUser } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const { searchParams } = new URL(request.url);
  const pricingConfigId = searchParams.get('pricingConfigId') ?? undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

  const history = await getPricingHistory(pricingConfigId, limit);
  return NextResponse.json({ data: history });
});
