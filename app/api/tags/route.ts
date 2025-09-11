import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TagCreateSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  category: z.string(),
  color: z.string(),
  visibility: z.enum(['public', 'private', 'system']),
  sort_order: z.number().min(0).max(999),
  parent_tag_id: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  is_system: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const teamId = searchParams.get('teamId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query based on user permissions
    let query = supabase
      .from('tags')
      .select(`
        *,
        parent_tag:parent_tag_id (
          id,
          name,
          color
        )
      `)

    // Add filters for user access
    const orCondition = `is_system.eq.true,user_id.eq.${user.id}${teamId ? `,team_id.eq.${teamId}` : ''}`
    query = query.or(orCondition)

    query = query.order('is_system', { ascending: false })
      .order('sort_order')
      .order('name')

    const { data: tags, error } = await query

    if (error) {
      console.error('Error fetching tags:', error)
      
      // If the table doesn't exist, return an empty tags array instead of failing
      if (error.code === '42P01') { // Table doesn't exist error code
        console.log('Tags table does not exist yet, returning empty array')
        return NextResponse.json({ tags: [] })
      }
      
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error in tags API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()

    // Validate input
    const tagData = TagCreateSchema.parse(body)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prepare tag data for insert
    const insertData = {
      name: tagData.name,
      description: tagData.description || null,
      category: tagData.category,
      color: tagData.color,
      visibility: tagData.visibility,
      sort_order: tagData.sort_order,
      parent_tag_id: tagData.parent_tag_id || null,
      user_id: user.id,
      team_id: tagData.teamId || null,
      is_system: tagData.is_system || false,
      metadata: tagData.metadata || {}
    }

    // Insert the tag
    const { data: tag, error } = await supabase
      .from('tags')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      
      // If the table doesn't exist, provide helpful error message
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Tags system not yet set up. Please contact support to enable the tags feature.' 
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in tags POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}