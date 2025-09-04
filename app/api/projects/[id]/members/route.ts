import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { addProjectMember, requirePermission } from '@/lib/rbac'
import { ProjectRole } from '@/types/supabase'
import { z } from 'zod'

const AddMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'manager', 'contributor', 'viewer'] as const),
  permissionOverrides: z.record(z.record(z.boolean())).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Check read permission for project members
    const { allowed, error: permError } = await requirePermission(
      projectId,
      'campaign',
      'read'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    const supabase = createSupabaseServerClient()

    const { data: members, error } = await supabase
      .from('project_members')
      .select(`
        *,
        user:user_id (id, display_name, email),
        invited_by_user:invited_by (id, display_name, email)
      `)
      .eq('project_id', projectId)
      .order('joined_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error in project members GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const { userId, role, permissionOverrides } = AddMemberSchema.parse(body)

    // Check permission to manage project members
    const { allowed, error: permError, userId: currentUserId } = await requirePermission(
      projectId,
      'campaign',
      'manage_permissions'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    // Add the member
    const { member, error } = await addProjectMember(
      projectId,
      userId,
      role,
      currentUserId || undefined
    )

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // Apply permission overrides if provided
    if (permissionOverrides && member) {
      const supabase = createSupabaseServerClient()
      
      const { data: updatedMember, error: updateError } = await supabase
        .from('project_members')
        .update({ permission_overrides: permissionOverrides })
        .eq('id', member.id)
        .select(`
          *,
          user:user_id (id, display_name, email)
        `)
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ member: updatedMember }, { status: 201 })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error in project members POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}