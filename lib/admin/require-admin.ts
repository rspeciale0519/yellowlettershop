import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import type { AdminUser, AdminRole } from './types';

const ADMIN_ROLES: AdminRole[] = ['admin', 'super_admin'];

/**
 * Validates the request comes from an admin user.
 * Returns AdminUser on success, or a 403 NextResponse on failure.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AdminUser | NextResponse> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: 'User profile not found' },
      { status: 403 }
    );
  }

  if (!ADMIN_ROLES.includes(profile.role as AdminRole)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return {
    user,
    userId: user.id,
    role: profile.role as AdminRole,
    fullName: profile.full_name,
    email: user.email ?? '',
  };
}

/**
 * HOF wrapper for admin-only API route handlers.
 */
export function withAdmin(
  handler: (request: NextRequest, admin: AdminUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await requireAdmin(request);

    if (result instanceof NextResponse) {
      return result;
    }

    return handler(request, result);
  };
}

/**
 * HOF wrapper requiring super_admin role specifically.
 */
export function withSuperAdmin(
  handler: (request: NextRequest, admin: AdminUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await requireAdmin(request);

    if (result instanceof NextResponse) {
      return result;
    }

    if (result.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    return handler(request, result);
  };
}
