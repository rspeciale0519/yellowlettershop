import { timeBasedPermissions } from '@/lib/access-control/time-based-permissions'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    const templates = await timeBasedPermissions.getPermissionTemplates(teamId || undefined)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching permission templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permission templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, team_id, template_permissions } = body

    if (!name || !template_permissions || !Array.isArray(template_permissions)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const template = await timeBasedPermissions.createPermissionTemplate({
      name,
      description,
      team_id,
      template_permissions
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating permission template:', error)
    return NextResponse.json(
      { error: 'Failed to create permission template' },
      { status: 500 }
    )
  }
}
