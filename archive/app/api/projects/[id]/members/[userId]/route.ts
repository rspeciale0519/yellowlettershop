import { NextRequest, NextResponse } from 'next/server'
import { updateProjectMember, removeProjectMember, requirePermission } from '@/lib/rbac'
import { z } from 'zod'

const UpdateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'manager', 'contributor', 'viewer'] as const).optional(),
  permissionOverrides: z.record(z.record(z.boolean())).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const projectId = params.id
    const targetUserId = params.userId
    const body = await request.json()
    const updates = UpdateMemberSchema.parse(body)

    // Check permission to manage project members
    const { allowed, error: permError } = await requirePermission(
      projectId,
      'campaign',
      'manage_permissions'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    const { member, error } = await updateProjectMember(
      projectId,
      targetUserId,
      updates
    )

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error in project member PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const projectId = params.id
    const targetUserId = params.userId

    // Check permission to manage project members
    const { allowed, error: permError } = await requirePermission(
      projectId,
      'campaign',
      'manage_permissions'
    )

    if (permError || !allowed) {
      return NextResponse.json({ 
        error: permError || 'Permission denied' 
      }, { status: 403 })
    }

    const { success, error } = await removeProjectMember(
      projectId,
      targetUserId
    )

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error in project member DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}