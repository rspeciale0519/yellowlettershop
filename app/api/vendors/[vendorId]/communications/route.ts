import { NextRequest, NextResponse } from 'next/server'
import { VendorService } from '@/lib/vendors/vendor-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorId = params.vendorId

    const vendorService = new VendorService()
    const communications = await vendorService.getCommunicationHistory(vendorId)

    return NextResponse.json(communications)

  } catch (error) {
    console.error('Get vendor communications error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get vendor communications' },
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
    const { type, subject, content, direction } = await request.json()

    if (!type || !subject || !content) {
      return NextResponse.json(
        { error: 'Type, subject, and content are required' },
        { status: 400 }
      )
    }

    const vendorService = new VendorService()
    const communication = await vendorService.recordCommunication(
      vendorId,
      type,
      subject,
      content,
      direction
    )

    return NextResponse.json(communication)

  } catch (error) {
    console.error('Record vendor communication error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record communication' },
      { status: 500 }
    )
  }
}
