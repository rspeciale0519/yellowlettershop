import { NextRequest, NextResponse } from 'next/server'
import { ListBuilderService, ListBuilderRequest } from '@/lib/list-builder/list-builder-service'

export async function POST(request: NextRequest) {
  try {
    const requestData: ListBuilderRequest = await request.json()

    if (!requestData.name || !requestData.criteria) {
      return NextResponse.json(
        { error: 'Name and criteria are required' },
        { status: 400 }
      )
    }

    const listBuilder = new ListBuilderService()
    const result = await listBuilder.buildList(requestData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      mailingList: result.mailingList,
      recordCount: result.recordCount,
      estimatedCost: result.estimatedCost
    })

  } catch (error) {
    console.error('List builder build error:', error)
    return NextResponse.json(
      { error: 'Failed to build list' },
      { status: 500 }
    )
  }
}
