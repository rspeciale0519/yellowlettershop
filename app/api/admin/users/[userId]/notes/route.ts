import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { getUserNotes, addUserNote } from '@/lib/admin/user-service';
import type { AdminUser } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-2)!;
  const notes = await getUserNotes(userId);
  return NextResponse.json({ data: notes });
});

export const POST = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-2)!;
  const body = await request.json();

  const schema = z.object({ content: z.string().min(1).max(5000) });
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const note = await addUserNote(userId, parsed.data.content, admin.userId);
  return NextResponse.json({ data: note }, { status: 201 });
});
