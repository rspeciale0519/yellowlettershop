import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { calculatePricing, MailingOptions } from '@/lib/orders/pricing'

const MailingOptionsSchema = z.object({
  serviceLevel: z.enum(['full_service', 'ship_processed', 'print_only']),
  mailPieceFormat: z.string().optional(),
  paperStock: z.string().optional(),
  finish: z.string().optional(),
  postageType: z.string().optional(),
  includePostage: z.boolean().optional()
})

const ListDataSchema = z.object({
  totalRecords: z.number().optional(),
  manualRecords: z.array(z.unknown()).optional()
}).optional()

const PricingFromStateSchema = z.object({
  orderState: z.object({
    mailingOptions: MailingOptionsSchema.optional(),
    campaignSettings: z.object({
      mailingOptions: z.record(z.unknown()).optional()
    }).optional(),
    listData: ListDataSchema,
    dataAndMapping: z.object({
      listData: ListDataSchema
    }).optional()
  })
})

export const POST = withAuth(async (req: NextRequest, { userId: _userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { orderState } = PricingFromStateSchema.parse(body)

    const rawMailingOptions = orderState.mailingOptions ?? orderState.campaignSettings?.mailingOptions

    if (!rawMailingOptions || !('serviceLevel' in rawMailingOptions)) {
      return NextResponse.json({ error: 'Mailing options not configured' }, { status: 400 })
    }

    const parsed = MailingOptionsSchema.safeParse(rawMailingOptions)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid mailing options', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const mailingOptions = parsed.data as MailingOptions

    const listData = orderState.dataAndMapping?.listData ?? orderState.listData
    const recordCount = listData?.totalRecords
      ?? (listData?.manualRecords?.length ?? 0)

    if (recordCount < 1) {
      return NextResponse.json({ error: 'Record count must be at least 1' }, { status: 400 })
    }

    return NextResponse.json(calculatePricing(mailingOptions, recordCount))

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Pricing error:', err)
    return NextResponse.json({ error: 'Pricing calculation failed' }, { status: 500 })
  }
})
