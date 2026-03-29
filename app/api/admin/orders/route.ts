import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { listOrders } from '@/lib/admin/order-service';
import type { AdminUser, AdminOrderFilters } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const { searchParams } = new URL(request.url);

  const filters: AdminOrderFilters = {
    status: searchParams.get('status') ?? undefined,
    userId: searchParams.get('userId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    sortBy: (searchParams.get('sortBy') as AdminOrderFilters['sortBy']) ?? 'created_at',
    sortOrder: (searchParams.get('sortOrder') as AdminOrderFilters['sortOrder']) ?? 'desc',
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: parseInt(searchParams.get('limit') ?? '25', 10),
  };

  const result = await listOrders(filters);
  return NextResponse.json(result);
});
