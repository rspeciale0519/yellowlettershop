import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { saveDesignForUser } from '@/lib/designer/save-design-server'

function handler(update: boolean) {
  return withAuth(async (request: NextRequest, { userId }) => {
    let input: unknown
    try { input = await request.json() } catch {
      return NextResponse.json({ ok: false, recoverySaved: false, message: 'Invalid JSON request', error: 'Invalid JSON request' }, { status: 400 })
    }
    const result = await saveDesignForUser(createClient(), userId, input, update)
    return NextResponse.json(result.body, { status: result.status })
  })
}

export const POST = handler(false)
export const PUT = handler(true)
