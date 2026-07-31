import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { withAdmin } from '@/lib/admin/require-admin'
import type { AdminUser } from '@/lib/admin/types'
import {
  listVendors,
  createVendor,
  updateVendor,
  deactivateVendor,
} from '@/lib/vendors/vendor-directory'

// Vendors are an operational directory: any signed-in user may read them (the
// dispatch UI lists them), but only admins may change them. These handlers were
// previously unauthenticated and delegated to a service that wrote columns the
// vendors table does not have.

const vendorTypeSchema = z.enum(['print', 'skip_trace', 'data', 'fulfillment', 'other'])

const createSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.union([vendorTypeSchema, z.array(vendorTypeSchema).min(1)]),
  contactInfo: z.record(z.unknown()).optional(),
  pricingTiers: z.unknown().optional(),
})

const updateSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  type: z.union([vendorTypeSchema, z.array(vendorTypeSchema).min(1)]).optional(),
  contactInfo: z.record(z.unknown()).optional(),
  pricingTiers: z.unknown().optional(),
  isActive: z.boolean().optional(),
})

const deleteSchema = z.object({ vendorId: z.string().uuid() })

function fail(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback
  console.error(fallback, error)
  return NextResponse.json({ error: message }, { status: 500 })
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? undefined
    const status = searchParams.get('status')

    const vendors = await listVendors({
      type,
      status: status === 'active' || status === 'inactive' ? status : undefined,
    })

    return NextResponse.json(vendors)
  } catch (error) {
    return fail(error, 'Failed to get vendors')
  }
})

export const POST = withAdmin(async (request: NextRequest, _admin: AdminUser) => {
  const parsed = createSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    return NextResponse.json(await createVendor(parsed.data))
  } catch (error) {
    return fail(error, 'Failed to create vendor')
  }
})

export const PATCH = withAdmin(async (request: NextRequest, _admin: AdminUser) => {
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { vendorId, ...patch } = parsed.data
  try {
    return NextResponse.json(await updateVendor(vendorId, patch))
  } catch (error) {
    return fail(error, 'Failed to update vendor')
  }
})

export const DELETE = withAdmin(async (request: NextRequest, _admin: AdminUser) => {
  const parsed = deleteSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    // Soft-delete: order_dispatches reference vendors, so history must survive.
    await deactivateVendor(parsed.data.vendorId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return fail(error, 'Failed to deactivate vendor')
  }
})
