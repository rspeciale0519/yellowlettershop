import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TagUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  visibility: z.enum(['public', 'private', 'system']).optional(),
  sort_order: z.number().min(0).max(999).optional(),
  metadata: z.record(z.any()).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: tagId } = await params
    const body = await request.json()

    // Validate input
    const updates = TagUpdateSchema.parse(body)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if tag exists and user has permission
    const { data: existingTag, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single()

    if (fetchError || !existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check permissions - only allow editing if user owns the tag or it's their team tag
    const canEdit = existingTag.user_id === user.id || 
      (existingTag.team_id && existingTag.visibility === 'public')

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description || null
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata

    // Only allow category and visibility changes for non-system tags
    if (!existingTag.is_system) {
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.visibility !== undefined) updateData.visibility = updates.visibility
    }

    // Update the tag
    const { data: tag, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', tagId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tag:', error)
      
      // If the table doesn't exist, provide helpful error message
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Tags system not yet set up. Please contact support to enable the tags feature.' 
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }

    return NextResponse.json({ tag })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Error in tags PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: tagId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if tag exists and user has permission
    const { data: existingTag, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single()

    if (fetchError || !existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Prevent deletion of system tags
    if (existingTag.is_system) {
      return NextResponse.json({ error: 'Cannot delete system tags' }, { status: 400 })
    }

    // Check permissions
    const canDelete = existingTag.user_id === user.id
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete the tag (cascade will handle record_tags cleanup)
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      console.error('Error deleting tag:', error)
      
      // If the table doesn't exist, provide helpful error message  
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Tags system not yet set up. Please contact support to enable the tags feature.' 
        }, { status: 503 })
      }
      
      return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in tags DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}