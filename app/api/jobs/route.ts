import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createJob, getJob, getUserJobs, cancelJob } from '@/lib/jobs/job-queue'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Job type is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Create the background job
    const job = createJob(type, data, user.id)
    
    return NextResponse.json({ 
      success: true, 
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt
      }
    })

  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get all jobs for the user
    const jobs = getUserJobs(user.id)
    
    return NextResponse.json({ 
      success: true, 
      jobs: jobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        metadata: job.metadata
      }))
    })

  } catch (error) {
    console.error('Job listing error:', error)
    return NextResponse.json(
      { error: 'Failed to get jobs' },
      { status: 500 }
    )
  }
}
