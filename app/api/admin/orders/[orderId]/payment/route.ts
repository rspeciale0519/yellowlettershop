import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { captureOrderPayment, refundOrder } from '@/lib/admin/order-service';
import type { AdminUser } from '@/lib/admin/types';

const actionSchema = z.object({
  action: z.enum(['capture', 'refund']),
  paymentIntentId: z.string().min(1),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const POST = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const orderId = new URL(request.url).pathname.split('/').at(-2)!;
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, paymentIntentId, amount, reason } = parsed.data;

  try {
    if (action === 'capture') {
      await captureOrderPayment(orderId, paymentIntentId, admin.userId);
    } else if (action === 'refund') {
      await refundOrder(orderId, paymentIntentId, amount, reason ?? 'Admin refund', admin.userId);
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
