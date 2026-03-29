import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { addUserCredit, getUserCreditBalance } from '@/lib/admin/user-service';
import { createServiceClient } from '@/utils/supabase/service';
import type { AdminUser } from '@/lib/admin/types';

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-2)!;
  const supabase = createServiceClient();

  const [balance, historyRes] = await Promise.all([
    getUserCreditBalance(userId),
    supabase.from('user_credits').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    data: { balance, history: historyRes.data ?? [] },
  });
});

export const POST = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const userId = new URL(request.url).pathname.split('/').at(-2)!;
  const body = await request.json();

  const schema = z.object({
    amount: z.number(),
    type: z.enum(['credit', 'debit', 'refund_credit', 'promotional', 'adjustment']),
    description: z.string().min(1).max(500),
    referenceId: z.string().optional(),
    referenceType: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const credit = await addUserCredit(
    userId,
    parsed.data.amount,
    parsed.data.type,
    parsed.data.description,
    admin.userId,
    parsed.data.referenceId,
    parsed.data.referenceType
  );

  return NextResponse.json({ data: credit }, { status: 201 });
});
