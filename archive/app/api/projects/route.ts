import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createProject, getUserProjects } from '@/lib/rbac'
import { z } from 'zod'

const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['campaign', 'template_set', 'general']).optional(),
  teamId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  settings: z.record(z.any()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const { projects, error } = await getUserProjects(userId || undefined)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error in projects GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const projectData = ProjectCreateSchema.parse(body)

    const { project, error } = await createProject(projectData)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Error in projects POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}