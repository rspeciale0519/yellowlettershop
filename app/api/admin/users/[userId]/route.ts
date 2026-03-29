import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { getUserDetail, updateUserStatus, updateUserRole } from '@/lib/admin/user-service';
import type { AdminUser } from '@/lib/admin/types';

const updateSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.string().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-1)!;

  try {
    const detail = await getUserDetail(userId);
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
});

export const PATCH = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-1)!;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.status) {
    await updateUserStatus(userId, parsed.data.status, admin.userId, parsed.data.reason);
  }
  if (parsed.data.role) {
    await updateUserRole(userId, parsed.data.role, admin.userId);
  }

  return NextResponse.json({ success: true });
});
