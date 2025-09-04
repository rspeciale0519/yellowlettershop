import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { 
  checkBatchProcessingAllowed, 
  getBatchLimits, 
  estimateMemoryUsage,
  getBatchProcessingStats
} from '@/lib/system/batch-limits'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recordCount, priority = 'normal' } = await request.json()

    if (!recordCount || recordCount <= 0) {
      return NextResponse.json(
        { error: 'Valid record count is required' },
        { status: 400 }
      )
    }

    // Get user's subscription tier (default to 'free' for now)
    // In production, this would be fetched from user profile
    const subscriptionTier = 'free'

    // Estimate memory usage
    const estimatedMemoryMB = estimateMemoryUsage(recordCount)

    // Check if batch processing is allowed
    const result = await checkBatchProcessingAllowed({
      userId: user.id,
      recordCount,
      priority,
      estimatedMemoryMB
    }, subscriptionTier)

    // Get current limits for reference
    const limits = getBatchLimits(subscriptionTier)

    return NextResponse.json({
      success: true,
      result,
      limits,
      estimatedMemoryMB,
      subscriptionTier
    })

  } catch (error) {
    console.error('Batch limits check error:', error)
    return NextResponse.json(
      { error: 'Failed to check batch processing limits' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription tier
    const subscriptionTier = 'free'
    const limits = getBatchLimits(subscriptionTier)
    const stats = getBatchProcessingStats()

    return NextResponse.json({
      success: true,
      limits,
      stats,
      subscriptionTier
    })

  } catch (error) {
    console.error('Get batch limits error:', error)
    return NextResponse.json(
      { error: 'Failed to get batch processing limits' },
      { status: 500 }
    )
  }
}
