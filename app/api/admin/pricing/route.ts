import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAdmin } from '@/lib/admin/require-admin';
import { getAllPricing, createPricing } from '@/lib/admin/pricing-service';
import type { AdminUser, PricingCategory, PricingModel } from '@/lib/admin/types';

const CATEGORIES: PricingCategory[] = [
  'mail_piece', 'paper_stock', 'finish', 'postage',
  'shipping', 'volume_discount', 'address_validation',
  'add_on_service', 'design_service',
];

const MODELS: PricingModel[] = ['flat', 'per_unit', 'tiered', 'volume_discount'];

const createSchema = z.object({
  category: z.enum(CATEGORIES as [string, ...string[]]),
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  pricingModel: z.enum(MODELS as [string, ...string[]]),
  unitAmount: z.number().int().min(0).optional(),
  unitLabel: z.string().max(50).optional(),
  tierConfig: z.array(z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0).nullable(),
    price: z.number().int().min(0),
  })).optional(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GET = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as PricingCategory | null;
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const pricing = await getAllPricing(
    category ?? undefined,
    includeInactive
  );

  return NextResponse.json({ data: pricing });
});

export const POST = withAdmin(async (request: NextRequest, admin: AdminUser) => {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const created = await createPricing(parsed.data as Parameters<typeof createPricing>[0], admin.userId);
  return NextResponse.json({ data: created }, { status: 201 });
});
