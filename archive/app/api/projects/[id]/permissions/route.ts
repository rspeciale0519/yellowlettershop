import { NextRequest, NextResponse } from 'next/server'
import { checkUserPermission, checkUserPermissions, getUserProjectRole, getCurrentUser } from '@/lib/rbac'
import { RbacResourceType, PermissionAction } from '@/types/supabase'
import { z } from 'zod'

const PermissionCheckSchema = z.object({
  resourceType: z.enum(['mailing_list', 'campaign', 'template', 'record', 'tag', 'analytics', 'design'] as const),
  action: z.enum(['create', 'read', 'update', 'delete', 'manage_permissions', 'export', 'share'] as const),
  userId: z.string().uuid().optional()
})

const BulkPermissionCheckSchema = z.object({
  checks: z.array(z.object({
    resourceType: z.enum(['mailing_list', 'campaign', 'template', 'record', 'tag', 'analytics', 'design'] as const),
    action: z.enum(['create', 'read', 'update', 'delete', 'manage_permissions', 'export', 'share'] as const)
  })),
  userId: z.string().uuid().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await getCurrentUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = searchParams.get('userId') || user.id

    // Check if this is a single permission check
    const resourceType = searchParams.get('resourceType') as RbacResourceType
    const action = searchParams.get('action') as PermissionAction

    if (resourceType && action) {
      // Single permission check
      const { allowed, error } = await checkUserPermission(
        targetUserId,
        projectId,
        resourceType,
        action
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({ 
        allowed,
        resourceType,
        action,
        userId: targetUserId 
      })
    }

    // Get user's role and basic permissions
    const { role, error: roleError } = await getUserProjectRole(targetUserId, projectId)
    
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 500 })
    }

    // Get common permissions
    const commonChecks = [
      { resourceType: 'mailing_list' as RbacResourceType, action: 'create' as PermissionAction },
      { resourceType: 'mailing_list' as RbacResourceType, action: 'read' as PermissionAction },
      { resourceType: 'mailing_list' as RbacResourceType, action: 'update' as PermissionAction },
      { resourceType: 'mailing_list' as RbacResourceType, action: 'delete' as PermissionAction },
      { resourceType: 'campaign' as RbacResourceType, action: 'create' as PermissionAction },
      { resourceType: 'campaign' as RbacResourceType, action: 'read' as PermissionAction },
      { resourceType: 'campaign' as RbacResourceType, action: 'update' as PermissionAction },
      { resourceType: 'campaign' as RbacResourceType, action: 'delete' as PermissionAction },
      { resourceType: 'tag' as RbacResourceType, action: 'create' as PermissionAction },
      { resourceType: 'tag' as RbacResourceType, action: 'read' as PermissionAction },
      { resourceType: 'analytics' as RbacResourceType, action: 'read' as PermissionAction }
    ]

    const { permissions, error: permError } = await checkUserPermissions(
      targetUserId,
      projectId,
      commonChecks
    )

    if (permError) {
      return NextResponse.json({ error: permError }, { status: 500 })
    }

    return NextResponse.json({
      userId: targetUserId,
      projectId,
      role,
      permissions
    })
  } catch (error) {
    console.error('Error in permissions GET:', error)
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

    // Check if it's a single permission check or bulk check
    if ('checks' in body) {
      // Bulk permission check
      const { checks, userId } = BulkPermissionCheckSchema.parse(body)
      
      // Get current user if userId not provided
      let targetUserId = userId
      if (!targetUserId) {
        const { data: { user }, error: authError } = await getCurrentUser()
        if (authError || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        targetUserId = user.id
      }

      const { permissions, error } = await checkUserPermissions(
        targetUserId,
        projectId,
        checks
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({
        userId: targetUserId,
        projectId,
        permissions
      })
    } else {
      // Single permission check
      const { resourceType, action, userId } = PermissionCheckSchema.parse(body)
      
      // Get current user if userId not provided
      let targetUserId = userId
      if (!targetUserId) {
        const { data: { user }, error: authError } = await getCurrentUser()
        if (authError || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        targetUserId = user.id
      }

      const { allowed, error } = await checkUserPermission(
        targetUserId,
        projectId,
        resourceType,
        action
      )

      if (error) {
        return NextResponse.json({ error }, { status: 500 })
      }

      return NextResponse.json({
        userId: targetUserId,
        projectId,
        resourceType,
        action,
        allowed
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error in permissions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}