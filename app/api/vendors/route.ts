import { NextRequest, NextResponse } from 'next/server'
import { VendorService, CreateVendorRequest, UpdateVendorRequest } from '@/lib/vendors/vendor-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const services = searchParams.get('services')?.split(',')

    const vendorService = new VendorService()
    const vendors = await vendorService.getVendors({
      type: type || undefined,
      status: status || undefined,
      services: services || undefined
    })

    return NextResponse.json(vendors)

  } catch (error) {
    console.error('Get vendors error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData: CreateVendorRequest = await request.json()

    if (!requestData.name || !requestData.type) {
      return NextResponse.json(
        { error: 'Vendor name and type are required' },
        { status: 400 }
      )
    }

    const vendorService = new VendorService()
    const vendor = await vendorService.createVendor(requestData)

    return NextResponse.json(vendor)

  } catch (error) {
    console.error('Create vendor error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create vendor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { vendorId, ...updateData }: { vendorId: string } & UpdateVendorRequest = await request.json()

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    const vendorService = new VendorService()
    const vendor = await vendorService.updateVendor(vendorId, updateData)

    return NextResponse.json(vendor)

  } catch (error) {
    console.error('Update vendor error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { vendorId } = await request.json()

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    const vendorService = new VendorService()
    await vendorService.deleteVendor(vendorId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete vendor error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
