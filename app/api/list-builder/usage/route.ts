import { NextRequest, NextResponse } from 'next/server'
import { ListBuilderService } from '@/lib/list-builder/list-builder-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const listBuilder = new ListBuilderService()
    const stats = await listBuilder.getUsageStats(userId || undefined)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('List builder usage stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get usage statistics' },
      { status: 500 }
    )
  }
}
