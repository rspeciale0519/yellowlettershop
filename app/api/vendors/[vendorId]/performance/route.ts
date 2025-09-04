import { NextRequest, NextResponse } from 'next/server'
import { VendorService } from '@/lib/vendors/vendor-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorId = params.vendorId

    const vendorService = new VendorService()
    const performance = await vendorService.getVendorPerformance(vendorId)

    return NextResponse.json(performance)

  } catch (error) {
    console.error('Get vendor performance error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get vendor performance' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorId = params.vendorId
    const { metricType, value, orderId, notes } = await request.json()

    if (!metricType || value === undefined) {
      return NextResponse.json(
        { error: 'Metric type and value are required' },
        { status: 400 }
      )
    }

    const vendorService = new VendorService()
    await vendorService.recordPerformanceMetric(vendorId, metricType, value, orderId, notes)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Record performance metric error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record performance metric' },
      { status: 500 }
    )
  }
}
