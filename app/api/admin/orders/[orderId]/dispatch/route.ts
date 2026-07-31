import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import {
  dispatchOrder,
  updateDispatchStatus,
  latestDispatch,
} from '@/lib/fulfillment/dispatch-service';
import type { AdminUser } from '@/lib/admin/types';

// Vendor fulfillment hand-off for a single order.
//   POST   → dispatch to a vendor (named, or the active print vendor)
//   PATCH  → advance the dispatch (accepted → in_production → shipped → delivered)
//   GET    → the current dispatch, if any

const dispatchSchema = z.object({
  vendorId: z.string().uuid().optional(),
});

const statusSchema = z.object({
  status: z.enum(['accepted', 'in_production', 'shipped', 'delivered', 'failed']),
  trackingNumber: z.string().max(100).optional(),
  trackingCarrier: z.string().max(50).optional(),
});

/** Path is /api/admin/orders/<orderId>/dispatch → orderId is second from last. */
function orderIdFrom(request: NextRequest): string {
  return new URL(request.url).pathname.split('/').at(-2)!;
}

/**
 * Guard refusals ("not captured", "already dispatched", "no active print
 * vendor") are actionable, so they return 409 with the message intact rather
 * than a generic 500.
 */
function handleError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  console.error(fallback, error);
  const isGuard =
    error instanceof Error &&
    /not found|already dispatched|no active print vendor|refusing to dispatch|only captured|no recipients|no approved proof|no contact email|inactive|Cannot move|not been dispatched|Unknown dispatch state/i.test(
      message
    );
  return NextResponse.json({ error: message }, { status: isGuard ? 409 : 500 });
}

export const GET = withAdmin(async (request: NextRequest, _admin: AdminUser) => {
  try {
    return NextResponse.json({ dispatch: await latestDispatch(orderIdFrom(request)) });
  } catch (error) {
    return handleError(error, 'Failed to load dispatch');
  }
});

export const POST = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const body = await request.json().catch(() => ({}));
  const parsed = dispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await dispatchOrder({
      orderId: orderIdFrom(request),
      actorId: admin.userId,
      vendorId: parsed.data.vendorId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Failed to dispatch order');
  }
});

export const PATCH = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await updateDispatchStatus({
      orderId: orderIdFrom(request),
      actorId: admin.userId,
      ...parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, 'Failed to update dispatch');
  }
});
