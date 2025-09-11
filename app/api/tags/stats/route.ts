import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get all tags accessible to user with media file usage counts
    const orCondition = `is_system.eq.true,user_id.eq.${user.id}`
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select(`
        *,
        parent_tag:parent_tag_id (
          id,
          name,
          color
        )
      `)
      .or(orCondition)
      .order('is_system', { ascending: false })
      .order('sort_order')
      .order('name')

    if (tagsError) {
      console.error('Error fetching tags:', tagsError)
      if (tagsError.code === '42P01') {
        return NextResponse.json({ stats: [] })
      }
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    // Get usage counts from media files
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('user_assets')
      .select('metadata')
      .eq('user_id', user.id)
      .not('metadata', 'is', null)

    // Count tag usage in media files
    const tagCounts: Record<string, number> = {}
    if (mediaFiles && !mediaError) {
      mediaFiles.forEach(file => {
        const metadata = file.metadata as any
        const fileTags = metadata?.tags || []
        if (Array.isArray(fileTags)) {
          fileTags.forEach(tagName => {
            if (typeof tagName === 'string') {
              tagCounts[tagName] = (tagCounts[tagName] || 0) + 1
            }
          })
        }
      })
    }

    // Combine tags with their counts
    const tagsWithCounts = (tags || []).map(tag => ({
      ...tag,
      count: tagCounts[tag.name] || 0
    })).slice(0, limit)

    return NextResponse.json({
      success: true,
      stats: tagsWithCounts
    })

  } catch (error) {
    console.error('Tag stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag statistics' },
      { status: 500 }
    )
  }
}
