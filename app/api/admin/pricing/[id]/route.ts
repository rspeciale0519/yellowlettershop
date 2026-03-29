import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { getPricingById, updatePricing, getPricingHistory } from '@/lib/admin/pricing-service';
import type { AdminUser } from '@/lib/admin/types';

const updateSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  unitAmount: z.number().int().min(0).optional(),
  unitLabel: z.string().max(50).optional(),
  tierConfig: z.array(z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0).nullable(),
    price: z.number().int().min(0),
  })).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
  reason: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;

  const pricing = await getPricingById(id);
  if (!pricing) {
    return NextResponse.json({ error: 'Pricing entry not found' }, { status: 404 });
  }

  const history = await getPricingHistory(id, 20);
  return NextResponse.json({ data: pricing, history });
});

export const PATCH = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reason, ...updates } = parsed.data;

  const updated = await updatePricing(id, updates, admin.userId, reason);
  return NextResponse.json({ data: updated });
});

export const DELETE = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;

  const updated = await updatePricing(
    id,
    { isActive: false },
    admin.userId,
    'Deactivated via admin panel'
  );

  return NextResponse.json({ data: updated });
});
