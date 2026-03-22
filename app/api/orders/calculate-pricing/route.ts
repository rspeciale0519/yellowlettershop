import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'

const PricingRequestSchema = z.object({
  mailingOptions: z.object({
    serviceLevel: z.enum(['full_service', 'ship_processed', 'print_only']),
    mailPieceFormat: z.enum(['postcard_4x6', 'postcard_5x7', 'letter_8_5x11', 'letter_folded']).optional(),
    paperStock: z.enum(['standard_14pt', 'premium_16pt', 'luxury_18pt']).optional(),
    finish: z.enum(['matte', 'gloss', 'uv_coating']).optional(),
    postageType: z.enum(['first_class_forever', 'first_class_discounted', 'standard']).optional(),
    includePostage: z.boolean().optional()
  }),
  recordCount: z.number().min(1)
})

// Pricing constants (in cents to avoid floating point issues)
const PRICING = {
  printing: {
    // Base printing costs per format (in cents)
    postcard_4x6: 45,    // $0.45 per piece
    postcard_5x7: 65,    // $0.65 per piece  
    letter_8_5x11: 75,   // $0.75 per piece
    letter_folded: 95    // $0.95 per piece
  },
  paperStock: {
    standard_14pt: 0,    // Base price
    premium_16pt: 5,     // +$0.05 per piece
    luxury_18pt: 10      // +$0.10 per piece
  },
  finish: {
    matte: 0,           // Base price
    gloss: 2,           // +$0.02 per piece
    uv_coating: 5       // +$0.05 per piece
  },
  postage: {
    first_class_forever: 73,      // $0.73 per piece
    first_class_discounted: 60,   // $0.60 per piece
    standard: 25                  // $0.25 per piece (bulk rate)
  },
  shipping: {
    // Shipping costs based on service level and quantity
    ship_processed: {
      base: 1500,       // $15.00 base cost
      perPiece: 2       // $0.02 per piece
    },
    full_service: {
      base: 0,          // No shipping cost (included in service)
      perPiece: 0
    }
  },
  // Volume discount tiers
  volumeDiscounts: [
    { minQuantity: 5000, discount: 0.10 },   // 10% off 5000+
    { minQuantity: 2500, discount: 0.07 },   // 7% off 2500+
    { minQuantity: 1000, discount: 0.05 },   // 5% off 1000+
    { minQuantity: 500, discount: 0.03 }     // 3% off 500+
  ]
}

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { mailingOptions, recordCount } = PricingRequestSchema.parse(body)
    
    let totalCents = 0
    let printingCents = 0
    let postageCents = 0
    let shippingCents = 0
    let discountCents = 0
    
    // Calculate printing costs
    if (mailingOptions.serviceLevel !== 'print_only') {
      const formatCost = PRICING.printing[mailingOptions.mailPieceFormat || 'postcard_4x6']
      const paperCost = PRICING.paperStock[mailingOptions.paperStock || 'standard_14pt']
      const finishCost = PRICING.finish[mailingOptions.finish || 'matte']
      
      printingCents = (formatCost + paperCost + finishCost) * recordCount
    } else {
      // Print-only has a flat fee
      printingCents = 2500 // $25.00 for print-ready files
    }
    
    totalCents += printingCents
    
    // Calculate postage costs
    if (mailingOptions.serviceLevel === 'full_service' && 
        mailingOptions.includePostage && 
        mailingOptions.postageType) {
      
      let postageRate = PRICING.postage[mailingOptions.postageType]
      
      // Apply minimum quantity requirements for discounted rates
      if (mailingOptions.postageType === 'first_class_discounted' && recordCount < 200) {
        // Fall back to forever stamps if under minimum
        postageRate = PRICING.postage.first_class_forever
      } else if (mailingOptions.postageType === 'standard' && recordCount < 200) {
        // Fall back to first class if under minimum for standard
        postageRate = PRICING.postage.first_class_forever
      }
      
      postageCents = postageRate * recordCount
      totalCents += postageCents
    }
    
    // Calculate shipping costs
    if (mailingOptions.serviceLevel === 'ship_processed') {
      const shipping = PRICING.shipping.ship_processed
      shippingCents = shipping.base + (shipping.perPiece * recordCount)
      totalCents += shippingCents
    }
    
    // Apply volume discounts (only to printing costs for fairness)
    const applicableDiscount = PRICING.volumeDiscounts.find(
      tier => recordCount >= tier.minQuantity
    )
    
    if (applicableDiscount && printingCents > 0) {
      discountCents = Math.floor(printingCents * applicableDiscount.discount)
      totalCents -= discountCents
    }
    
    // Convert back to dollars for response
    const response = {
      printing: printingCents / 100,
      postage: postageCents > 0 ? postageCents / 100 : null,
      shipping: shippingCents > 0 ? shippingCents / 100 : null,
      discount: discountCents > 0 ? discountCents / 100 : null,
      total: totalCents / 100,
      recordCount,
      pricePerPiece: totalCents / recordCount / 100,
      breakdown: {
        printingDetails: {
          baseFormat: mailingOptions.mailPieceFormat,
          baseCost: PRICING.printing[mailingOptions.mailPieceFormat || 'postcard_4x6'] / 100,
          paperUpcharge: PRICING.paperStock[mailingOptions.paperStock || 'standard_14pt'] / 100,
          finishUpcharge: PRICING.finish[mailingOptions.finish || 'matte'] / 100
        },
        volumeDiscount: applicableDiscount ? {
          tier: applicableDiscount.minQuantity,
          percentage: applicableDiscount.discount * 100
        } : null
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Pricing calculation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pricing calculation failed' },
      { status: 500 }
    )
  }
})

// Get pricing information and tiers (for display purposes)
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const url = new URL(req.url)
    const recordCount = parseInt(url.searchParams.get('recordCount') || '100')
    
    // Return pricing structure and examples
    const response = {
      pricingStructure: {
        printing: Object.fromEntries(
          Object.entries(PRICING.printing).map(([key, cents]) => [key, cents / 100])
        ),
        paperStock: Object.fromEntries(
          Object.entries(PRICING.paperStock).map(([key, cents]) => [key, cents / 100])
        ),
        finish: Object.fromEntries(
          Object.entries(PRICING.finish).map(([key, cents]) => [key, cents / 100])
        ),
        postage: Object.fromEntries(
          Object.entries(PRICING.postage).map(([key, cents]) => [key, cents / 100])
        ),
        volumeDiscounts: PRICING.volumeDiscounts.map(tier => ({
          ...tier,
          qualifies: recordCount >= tier.minQuantity
        }))
      },
      examples: {
        postcard_4x6_500: calculateExample('postcard_4x6', 500),
        postcard_5x7_1000: calculateExample('postcard_5x7', 1000),
        letter_2500: calculateExample('letter_8_5x11', 2500)
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Pricing info error:', error)
    return NextResponse.json(
      { error: 'Failed to get pricing information' },
      { status: 500 }
    )
  }
})

function calculateExample(format: string, quantity: number) {
  const formatCost = PRICING.printing[format as keyof typeof PRICING.printing] || PRICING.printing.postcard_4x6
  const printingTotal = formatCost * quantity
  
  const discount = PRICING.volumeDiscounts.find(tier => quantity >= tier.minQuantity)
  const discountAmount = discount ? Math.floor(printingTotal * discount.discount) : 0
  
  return {
    format,
    quantity,
    printingCost: printingTotal / 100,
    discount: discountAmount / 100,
    total: (printingTotal - discountAmount) / 100,
    pricePerPiece: (printingTotal - discountAmount) / quantity / 100
  }
}