import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { searchRecordsByTags, getRecordsByTag } from '@/lib/database/tag-optimization'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      mailingListId,
      requiredTags,
      optionalTags,
      excludedTags,
      limit = 100,
      offset = 0
    } = await request.json()

    const records = await searchRecordsByTags(user.id, {
      mailingListId,
      requiredTags,
      optionalTags,
      excludedTags,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      records,
      count: records.length
    })

  } catch (error) {
    console.error('Tag search error:', error)
    return NextResponse.json(
      { error: 'Failed to search records by tags' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const mailingListId = searchParams.get('mailingListId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag parameter is required' },
        { status: 400 }
      )
    }

    const result = await getRecordsByTag(
      user.id,
      tag,
      mailingListId || undefined,
      limit,
      offset
    )

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Get records by tag error:', error)
    return NextResponse.json(
      { error: 'Failed to get records by tag' },
      { status: 500 }
    )
  }
}
