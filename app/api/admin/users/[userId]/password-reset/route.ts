import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/admin/require-admin';
import { resetUserPassword } from '@/lib/admin/user-service';
import type { AdminUser } from '@/lib/admin/types';

export const POST = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-2)!;

  try {
    await resetUserPassword(userId, admin.userId);
    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reset';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
