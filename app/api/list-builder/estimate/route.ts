import { NextRequest, NextResponse } from 'next/server'
import { ListBuilderService } from '@/lib/list-builder/list-builder-service'
import { ListBuilderCriteria } from '@/types/supabase'
import { withProtectedRoute } from '@/lib/auth/with-protected-route'

export const POST = withProtectedRoute(async (request: NextRequest) => {
  try {
    const { criteria }: { criteria: ListBuilderCriteria } = await request.json()

    if (!criteria) {
      return NextResponse.json(
        { error: 'Criteria is required' },
        { status: 400 }
      )
    }

    const listBuilder = new ListBuilderService()
    const estimate = await listBuilder.estimateListBuild(criteria)

    return NextResponse.json(estimate)

  } catch (error) {
    console.error('List builder estimate error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate list build' },
      { status: 500 }
    )
  }
}, { rateLimit: { scope: 'list-builder-estimate', max: 20, windowSeconds: 60 } })
