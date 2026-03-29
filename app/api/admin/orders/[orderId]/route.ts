import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { getOrderDetail, updateOrderStatus } from '@/lib/admin/order-service';
import type { AdminUser } from '@/lib/admin/types';

const updateSchema = z.object({
  status: z.enum(['submitted', 'processing', 'completed', 'cancelled']).optional(),
  notes: z.string().max(500).optional(),
});

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const orderId = new URL(request.url).pathname.split('/').at(-1)!;

  try {
    const detail = await getOrderDetail(orderId);
    return NextResponse.json({ data: detail });
  } catch {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
});

export const PATCH = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const orderId = new URL(request.url).pathname.split('/').at(-1)!;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.status) {
    await updateOrderStatus(orderId, parsed.data.status, admin.userId, parsed.data.notes);
  }

  return NextResponse.json({ success: true });
});
