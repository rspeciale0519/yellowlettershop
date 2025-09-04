import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProject, requirePermission } from '@/lib/rbac'
import { z } from 'zod'

const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['campaign', 'template_set', 'general']).optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  isPublic: z.boolean().optional(),
  settings: z.record(z.any()).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Check read permission
    const { allowed, error: permError } = await requirePermission(
      projectId,
      'campaign', // Using campaign as the general project resource type
      'read'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    const { project, error } = await getProject(projectId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error in project GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const updates = ProjectUpdateSchema.parse(body)

    // Check update permission
    const { allowed, error: permError, userId } = await requirePermission(
      projectId,
      'campaign',
      'update'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    const supabase = createSupabaseServerClient()

    // Prepare update data
    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
    if (updates.settings !== undefined) updateData.settings = updates.settings

    // Handle archiving
    if (updates.status === 'archived') {
      updateData.archived_at = new Date().toISOString()
    } else if (updates.status === 'active' && updateData.status !== 'archived') {
      updateData.archived_at = null
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(`
        *,
        owner:owner_id (id, display_name, email),
        team:team_id (id, name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error in project PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Check delete permission
    const { allowed, error: permError } = await requirePermission(
      projectId,
      'campaign',
      'delete'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    const supabase = createSupabaseServerClient()

    // Delete the project (cascade will handle cleanup)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in project DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}