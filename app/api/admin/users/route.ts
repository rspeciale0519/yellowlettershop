import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { listUsers } from '@/lib/admin/user-service';
import type { AdminUser, AdminUserFilters } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const { searchParams } = new URL(request.url);

  const filters: AdminUserFilters = {
    search: searchParams.get('search') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    status: (searchParams.get('status') as AdminUserFilters['status']) ?? undefined,
    sortBy: (searchParams.get('sortBy') as AdminUserFilters['sortBy']) ?? 'created_at',
    sortOrder: (searchParams.get('sortOrder') as AdminUserFilters['sortOrder']) ?? 'desc',
    page: parseInt(searchParams.get('page') ?? '1', 10),
    limit: parseInt(searchParams.get('limit') ?? '25', 10),
  };

  const result = await listUsers(filters);
  return NextResponse.json(result);
});
