import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTagUsageStats, getPopularTags } from '@/lib/database/tag-optimization'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const stats = await getPopularTags(user.id, limit)

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Tag stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag statistics' },
      { status: 500 }
    )
  }
}
