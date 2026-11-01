/**
 * Legacy create-payment-intent route.
 * Client-supplied amounts are no longer accepted — the live wizard uses
 * POST /api/payments/intent, which recomputes the total server-side.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  void request
  return NextResponse.json(
    { error: 'Client-supplied amounts are not accepted. Use POST /api/payments/intent with order state.' },
    { status: 400 }
  )
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
