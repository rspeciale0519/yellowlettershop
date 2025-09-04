import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { bulkAddTags, bulkRemoveTags } from '@/lib/database/tag-optimization'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, recordIds, tags } = await request.json()

    if (!action || !recordIds || !Array.isArray(recordIds) || !tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Missing required parameters: action, recordIds, tags' },
        { status: 400 }
      )
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "add" or "remove"' },
        { status: 400 }
      )
    }

    let result
    if (action === 'add') {
      result = await bulkAddTags(recordIds, tags, user.id)
    } else {
      result = await bulkRemoveTags(recordIds, tags, user.id)
    }

    return NextResponse.json({
      action,
      ...result
    })

  } catch (error) {
    console.error('Bulk tag operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk tag operation' },
      { status: 500 }
    )
  }
}
